const form = document.getElementById('predict-form');
const resultDiv = document.getElementById('result');
const chartContainer = document.getElementById('chart-container');
const suggestionDiv = document.getElementById('suggestion');
const fieldSelect = document.getElementById('field');
const additionalFields = document.getElementById('additional-fields');
const additionalInputs = additionalFields.querySelectorAll('input');
let chart;

function toggleAdditionalFields() {
    if (fieldSelect.value) {
        additionalFields.style.display = 'block';
        additionalInputs.forEach((input) => {
            input.disabled = false;
            input.required = true;
        });
    } else {
        additionalFields.style.display = 'none';
        additionalInputs.forEach((input) => {
            input.disabled = true;
            input.required = false;
            input.value = '';
        });
    }
}

toggleAdditionalFields();
fieldSelect.addEventListener('change', toggleAdditionalFields);

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Validate that a field is selected
    if (!fieldSelect.value) {
        resultDiv.textContent = 'Please select a field of interest first';
        return;
    }
    
    resultDiv.textContent = 'Predicting...';
    chartContainer.style.display = 'none';
    suggestionDiv.textContent = '';

    const payload = {
        study_hours: document.getElementById('study_hours').value,
        attendance: document.getElementById('attendance').value,
        assignments: document.getElementById('assignments').value,
        participation: document.getElementById('participation').value,
        field_knowledge: document.getElementById('field_knowledge').value,
        experience: document.getElementById('experience').value,
        skills_score: document.getElementById('skills_score').value,
    };

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            resultDiv.textContent = data.error || 'Prediction failed';
            return;
        }

        resultDiv.textContent = `Result: ${data.prediction}`;

        // Show chart
        chartContainer.style.display = 'block';
        renderChart(data.pie_data);

        // Show suggestion
        suggestionDiv.textContent = data.suggestion;
    } catch (error) {
        resultDiv.textContent = 'Error connecting to server';
        console.error(error);
    }
});

function renderChart(pieData) {
    const ctx = document.getElementById('importanceChart').getContext('2d');
    if (chart) {
        chart.destroy();
    }
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: pieData.map(d => d.label),
            datasets: [{
                data: pieData.map(d => d.value),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384'
                ],
                hoverBackgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}
