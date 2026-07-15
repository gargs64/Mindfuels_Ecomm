import axios from 'axios';

/**
 * Validates and looks up details of a 6-digit Indian Pincode.
 * Query: https://api.postalpincode.in/pincode/:pincode
 */
export const lookupPincode = async (req, res) => {
  const { pincode } = req.params;

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ valid: false, error: 'Invalid pincode format. Must be 6 digits.' });
  }

  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, { timeout: 5000 });
    const data = response.data;

    if (!data || data.length === 0 || data[0].Status !== 'Success') {
      return res.status(200).json({ valid: false, error: 'Pincode not found or unserviceable.' });
    }

    const postOffices = data[0].PostOffice;
    if (!postOffices || postOffices.length === 0) {
      return res.status(200).json({ valid: false, error: 'No postal offices found for this pincode.' });
    }

    // Extrapolate City and State from first result
    const info = postOffices[0];
    const city = info.District || info.Block || info.Circle;
    const state = info.State;

    return res.status(200).json({
      valid: true,
      city: city,
      state: state,
      country: 'India'
    });
  } catch (error) {
    console.error(`Error looking up pincode ${pincode}:`, error.message);
    return res.status(500).json({
      valid: false,
      error: 'Failed to query pincode service. Please enter details manually.'
    });
  }
};
