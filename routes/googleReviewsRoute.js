const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        const placeId = process.env.GRANDEUR_NET_PLACE_ID;

        if (!apiKey || !placeId) {
            return res.status(500).json({ error: 'Missing Google API key or Place ID in .env' });
        }

        const url = `https://places.googleapis.com/v1/places/${placeId}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews'
            }
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: `Google API error: ${data.error.status}`, details: data.error.message });
        }

        res.json({
            name: data.displayName?.text,
            overallRating: data.rating,
            totalReviews: data.userRatingCount,
            reviews: (data.reviews || []).map(r => ({
                author_name: r.authorAttribution?.displayName,
                author_url: r.authorAttribution?.uri,
                profile_photo_url: r.authorAttribution?.photoUri,
                rating: r.rating,
                relative_time_description: r.relativePublishTimeDescription,
                text: r.text?.text,
            })),
        });

    } catch (err) {
        console.error('Google reviews error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;