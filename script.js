import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyBSmYiru32Y_kdkf1c3xxjd3AwEV26JEy8";
const genAI = new GoogleGenerativeAI(API_KEY);

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const loading = document.getElementById('loading');
const resultCard = document.getElementById('result-card');

// تشغيل الكاميرا
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("خطأ في الكاميرا:", err);
        alert("يرجى السماح بفتح الكاميرا للموقع لكي يعمل التحليل.");
    }
}

startCamera();

captureBtn.addEventListener('click', async () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

    loading.classList.remove('hidden');
    resultCard.classList.add('hidden');

    try {
        // تم تحديث اسم الموديل هنا لضمان وجوده في السيرفر
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = "أنت خبير بيئي. حلل الصورة وأعطني JSON بالعربية فقط وبدون أي نص إضافي: {\"item_name\": \"...\", \"material\": \"...\", \"recycling_ideas\": [\"1\",\"2\",\"3\"], \"carbon_savings\": 10, \"fun_fact\": \"...\"}";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // تنظيف متطور للنص لاستخراج الـ JSON فقط حتى لو الـ AI أخطأ
        const startBracket = text.indexOf('{');
        const endBracket = text.lastIndexOf('}');
        if (startBracket === -1 || endBracket === -1) throw new Error("لم يتمكن الذكاء الاصطناعي من تنسيق البيانات بشكل صحيح.");
        
        const jsonString = text.substring(startBracket, endBracket + 1);
        
        const data = JSON.parse(jsonString);
        displayResults(data);

    } catch (error) {
        console.error("تفاصيل الخطأ:", error);
        // إذا استمر خطأ 404، سنقوم بتجربة موديل بديل فوراً في المرة القادمة
        alert("خطأ تقني: " + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});

function displayResults(data) {
    document.getElementById('item-name').innerText = data.item_name || "منتج غير معروف";
    document.getElementById('item-material').innerText = data.material || "غير محدد";
    document.getElementById('carbon-value').innerText = data.carbon_savings || "0";
    document.getElementById('fact-text').innerText = data.fun_fact || "لا توجد معلومات إضافية.";
    
    const list = document.getElementById('recycling-list');
    list.innerHTML = (data.recycling_ideas || ["لا توجد أفكار حالياً"]).map(idea => `<li>${idea}</li>`).join('');
    
    resultCard.classList.remove('hidden');
}