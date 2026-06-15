require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse');
const axios = require('axios');
const fs = require('fs');
const Fuse = require('fuse.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veritasco', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Schemas
const CustomerSchema = new mongoose.Schema({
  customer_name: String,
  mobile_number: String,
  address: String,
  village: String,
  district: String,
  state: String,
  pincode: String,
  dealer_name: String,
  dealer_code: String,
  bike_model: String,
  invoice_amount: Number,
  purchase_date: Date,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
});
CustomerSchema.index({ location: '2dsphere' });
const Customer = mongoose.model('Customer', CustomerSchema);

const DictionarySchema = new mongoose.Schema({
  original: String,
  corrected: String
});
const Dictionary = mongoose.model('Dictionary', DictionarySchema);

// Multer for memory storage since frontend will send chunks or files
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    // If frontend sends JSON batch
    if (req.body.records) {
      const records = req.body.records;
      await processRecords(records);
      return res.json({ message: 'Batch processed successfully' });
    }

    // If frontend sends a file directly
    if (req.file) {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          await processRecords(results);
          fs.unlinkSync(req.file.path);
          res.json({ message: 'File processed successfully' });
        });
    } else {
      res.status(400).json({ error: 'No data provided' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function processRecords(records) {
  // 1. Fetch Location Dictionary
  const dict = await Dictionary.find({});
  const fuse = new Fuse(dict, { keys: ['original', 'corrected'], threshold: 0.3 });

  for (let record of records) {
    // 2. Clean Location
    if (record.village) {
      const match = fuse.search(record.village.toLowerCase());
      if (match.length > 0 && match[0].score < 0.3) {
        record.village = match[0].item.corrected;
      } else {
        const titleCase = record.village.replace(/\b\w/g, c => c.toUpperCase());
        await Dictionary.create({ original: record.village.toLowerCase(), corrected: titleCase });
        fuse.add({ original: record.village.toLowerCase(), corrected: titleCase });
        record.village = titleCase;
      }
    }

    // 3. Geocoding
    let lat = record.latitude ? parseFloat(record.latitude) : null;
    let lng = record.longitude ? parseFloat(record.longitude) : null;

    if (!lat || !lng) {
      // Check existing customer for same address cache
      const existing = await Customer.findOne({ address: record.address, village: record.village });
      if (existing && existing.location) {
        lat = existing.location.coordinates[1];
        lng = existing.location.coordinates[0];
      } else if (process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const query = `${record.address || ''}, ${record.village || ''}, ${record.district || ''}`.trim();
          const geoRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: { address: query, key: process.env.GOOGLE_MAPS_API_KEY }
          });
          if (geoRes.data.results.length > 0) {
            lat = geoRes.data.results[0].geometry.location.lat;
            lng = geoRes.data.results[0].geometry.location.lng;
          }
        } catch (e) {
          console.error('Geocode error:', e.message);
        }
      }
    }

    // 4. Save Customer
    if (lat && lng) {
      await Customer.create({
        customer_name: record.customer_name || record.CustomerName,
        mobile_number: record.mobile_number || record.Mobile,
        address: record.address,
        village: record.village,
        district: record.district,
        bike_model: record.bike_model || record.BikeModel,
        dealer_name: record.dealer_name || record.DealerName,
        invoice_amount: parseFloat(record.invoice_amount || record.InvoiceAmount) || 0,
        purchase_date: record.purchase_date ? new Date(record.purchase_date) : new Date(),
        location: {
          type: 'Point',
          coordinates: [lng, lat] // MongoDB uses [lng, lat]
        }
      });
    }
  }
}

app.get('/api/search', async (req, res) => {
  const { lat, lng, radius } = req.query;
  const radiusInMeters = parseFloat(radius) * 1000;

  try {
    const customers = await Customer.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true
        }
      }
    ]);
    
    // Map distance from meters to KM
    const results = customers.map(c => ({
      ...c,
      latitude: c.location.coordinates[1],
      longitude: c.location.coordinates[0],
      distance: c.distance / 1000
    }));

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    
    const salesAggregate = await Customer.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$invoice_amount" } } }
    ]);
    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0;

    const topDistricts = await Customer.aggregate([
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topModels = await Customer.aggregate([
      { $group: { _id: "$bike_model", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const revenueByArea = await Customer.aggregate([
      { $group: { _id: "$district", revenue: { $sum: "$invoice_amount" } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalCustomers,
      totalSales,
      topDistricts: topDistricts.map(d => ({ name: d._id || 'Unknown', count: d.count })),
      topModels: topModels.map(m => ({ name: m._id || 'Unknown', count: m.count })),
      revenueByArea: revenueByArea.map(r => ({ name: r._id || 'Unknown', revenue: r.revenue }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
