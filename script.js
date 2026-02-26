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
        // قائمة بالموديلات الممكنة (جوجل بتغير مسمياتها)
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-2.0-flash-exp", // موديل 2026 الأحدث
            "gemini-pro-vision"
        ];

        let response;
        let success = false;

        for (let modelName of modelsToTry) {
            try {
                console.log(`جاري تجربة الموديل: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = "حلل الصورة وأعطني JSON بالعربية: {item_name, material, recycling_ideas:[], carbon_savings:10, fun_fact}";
                
                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: imageData, mimeType: "image/jpeg" } }
                ]);
                
                response = await result.response;
                success = true;
                console.log(`نجح الاتصال باستخدام: ${modelName}`);
                break; // اخرج من اللوب لو اشتغل
            } catch (err) {
                console.warn(`الموديل ${modelName} غير متاح، بجرب اللي بعده...`);
            }
        }

        if (!success) throw new Error("كل الموديلات المتاحة لم تستجب. تأكد من إعدادات الـ API Key في Google Cloud.");

        const text = response.text();
        const startBracket = text.indexOf('{');
        const endBracket = text.lastIndexOf('}');
        const jsonString = text.substring(startBracket, endBracket + 1);
        
        displayResults(JSON.parse(jsonString));

    } catch (error) {
        console.error("خطأ نهائي:", error);
        alert("فشل التحليل: " + error.message);
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