export default async function handler(req, res) {
    if (req.method === 'GET') {
        res.status(200).json({ message: "Game API endpoint" });
    } else if (req.method === 'POST') {
        res.status(200).json({ message: "Game API POST request received", data: req.body })
    } else {
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    };
}