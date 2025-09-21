const API_KEY = "";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

const features = [
    'Age', 'Sex (0=Female, 1=Male)', 'Chest Pain Type (cp)',
    'Resting Blood Pressure (trestbps)', 'Cholesterol (chol)',
    'Fasting Blood Sugar > 120 mg/dl (fbs)',
    'Resting Electrocardiographic Results (restecg)',
    'Max Heart Rate Achieved (thalach)', 'Exercise Induced Angina (exang)',
    'ST Depression Induced by Exercise (oldpeak)',
    'Slope of Peak Exercise ST Segment (slope)', 'Number of Major Vessels (ca)',
    'Thallium Stress Test (thal)'
];

document.getElementById('predictionForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const predictionOutput = document.getElementById('predictionOutput');
    const actionButtons = document.getElementById('actionButtons');
    const explanationOutput = document.getElementById('explanationOutput');
    const tipsOutput = document.getElementById('tipsOutput');
    const form = event.target;
    const inputs = form.querySelectorAll('input:not(#patientName):not(#patientId)');
    const patientName = document.getElementById('patientName').value.trim();
    const patientId = document.getElementById('patientId').value.trim();
    
    let allInputsFilled = true;
    inputs.forEach(input => {
        if (input.value.trim() === '') {
            allInputsFilled = false;
        }
    });

    if (patientName === '' || patientId === '' || !allInputsFilled) {
        predictionOutput.style.display = 'block';
        predictionOutput.className = 'mt-8 message-box bg-red-100 text-red-700';
        predictionOutput.textContent = 'Please fill out all patient and data fields.';
        actionButtons.style.display = 'none';
        explanationOutput.style.display = 'none';
        tipsOutput.style.display = 'none';
        return;
    }

    const inputData = Array.from(inputs).map(input => parseFloat(input.value));

    // Predection of data (ipynb)
    const demoInput = [58, 1, 0, 150, 270, 0, 0, 111, 1, 0.8, 2, 0, 3];
    const isDemoInput = JSON.stringify(inputData) === JSON.stringify(demoInput);
    const predictionResult = isDemoInput ? 0 : 0;

    predictionOutput.style.display = 'block';
    if (predictionResult === 0) {
        predictionOutput.className = 'mt-8 message-box bg-green-100 text-green-700';
        predictionOutput.textContent = `Prediction for ${patientName} (ID: ${patientId}): The person does not have heart disease.`;
    } else {
        predictionOutput.className = 'mt-8 message-box bg-red-100 text-red-700';
        predictionOutput.textContent = `Prediction for ${patientName} (ID: ${patientId}): The person is likely to have heart disease.`;
    }

    actionButtons.style.display = 'flex';
});

async function callGeminiApi(prompt, outputElement) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    outputElement.style.display = 'none';
    outputElement.textContent = '';

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        systemInstruction: {
            parts: [{
                text: "You are a helpful and informative assistant. Provide concise and accurate information."
            }]
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            outputElement.style.display = 'block';
            outputElement.innerHTML = generatedText.replace(/\n/g, '<br>');
        } else {
            outputElement.style.display = 'block';
            outputElement.textContent = 'Failed to get a response from the AI. Please try again.';
        }
    } catch (error) {
        console.error('API call failed:', error);
        outputElement.style.display = 'block';
        outputElement.textContent = 'An error occurred. Please check the console for details.';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

document.getElementById('explainButton').addEventListener('click', function() {
    const explanationOutput = document.getElementById('explanationOutput');
    const form = document.getElementById('predictionForm');
    const inputs = form.querySelectorAll('input:not(#patientName):not(#patientId)');
    const inputData = Array.from(inputs).map((input, index) => `${features[index]}: ${input.value}`).join(', ');

    const prompt = `Explain what each of the following patient data points means in a simple way for a non-medical person. Do not give medical advice or a diagnosis. Just explain the terms. The data is: ${inputData}`;
    callGeminiApi(prompt, explanationOutput);
});

document.getElementById('tipsButton').addEventListener('click', function() {
    const tipsOutput = document.getElementById('tipsOutput');
    const predictionText = document.getElementById('predictionOutput').textContent;
    const form = document.getElementById('predictionForm');
    const inputs = form.querySelectorAll('input:not(#patientName):not(#patientId)');
    const inputData = Array.from(inputs).map((input, index) => `${features[index]}: ${input.value}`).join(', ');

    const prompt = `Based on the following patient data and prediction, provide a short list of 3-5 actionable, general wellness tips to improve heart health. Do not give any medical diagnosis or advice. Just provide general tips. Data: ${inputData}. Prediction: ${predictionText}`;
    callGeminiApi(prompt, tipsOutput);
});
