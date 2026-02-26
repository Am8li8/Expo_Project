import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyBSmYiru32Y_kdkf1c3xxjd3AwEV26JEy8";
const genAI = new GoogleGenerativeAI(API_KEY);

// إعداد الكاميرا والعناصر
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; });

captureBtn.addEventListener('click', async () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

    document.getElementById('loading').classList.remove('hidden');

    try {
        // استخدام الموديل الأحدث في 2026
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "حلل الصورة وأعطني JSON بالعربية: اسم المنتج، المادة، 3 أفكار لإعادة التدوير، جرامات الكربون الموفرة. (بدون علامات ```)";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const cleanJson = response.text().replace(/```json|```/g, "").trim();
        displayResults(JSON.parse(cleanJson));
    } catch (e) {
        console.error(e);
        alert("خطأ: تأكد من تشغيل الموقع من رابط HTTPS أو رفع الملفات");
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
});

function displayResults(data) {
    document.getElementById('item-name').innerText = data.item_name;
    document.getElementById('item-material').innerText = data.material;
    document.getElementById('carbon-value').innerText = data.carbon_savings;
    document.getElementById('recycling-list').innerHTML = data.recycling_ideas.map(i => `<li>${i}</li>`).join('');
    document.getElementById('result-card').classList.remove('hidden');
}