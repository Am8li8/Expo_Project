import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyBSmYiru32Y_kdkf1c3xxjd3AwEV26JEy8";
const genAI = new GoogleGenerativeAI(API_KEY);

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const loading = document.getElementById('loading');
const resultCard = document.getElementById('result-card');

// تشغيل الكاميرا مع التأكد من طلب الإذن
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("خطأ في الكاميرا:", err);
        alert("تأكد من إعطاء إذن الكاميرا للموقع");
    }
}

startCamera();

captureBtn.addEventListener('click', async () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // تحويل الصورة
    const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

    loading.classList.remove('hidden');
    resultCard.classList.add('hidden');

    try {
        // استخدام الموديل
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "حلل الصورة وأعطني JSON بالعربية فقط وبدون علامات ماركداون: {\"item_name\": \"...\", \"material\": \"...\", \"recycling_ideas\": [\"1\",\"2\",\"3\"], \"carbon_savings\": 8, \"fun_fact\": \"...\"}";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // تنظيف النص بشكل قوى من أي زوائد
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const data = JSON.parse(jsonString);
        displayResults(data);

    } catch (error) {
        console.error("التفاصيل التقنية للخطأ:", error);
        // عرض الخطأ الحقيقي للمساعدة في الحل
        alert("حدث خطأ تقني: " + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});

function displayResults(data) {
    document.getElementById('item-name').innerText = data.item_name;
    document.getElementById('item-material').innerText = data.material;
    document.getElementById('carbon-value').innerText = data.carbon_savings;
    document.getElementById('fact-text').innerText = data.fun_fact;
    
    const list = document.getElementById('recycling-list');
    list.innerHTML = data.recycling_ideas.map(idea => `<li>${idea}</li>`).join('');
    
    resultCard.classList.remove('hidden');
}