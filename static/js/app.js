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

// ============ QUIZ FUNCTIONALITY ============

let currentQuestions = [];
let currentAnswers = [];
let currentQuestionIndex = 0;
let lastQuizResult = null;

function switchTab(tabName) {
    // Hide all tab contents
    document.getElementById('predictor-section').classList.remove('active');
    document.getElementById('quiz-section').classList.remove('active');
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'predictor') {
        document.getElementById('predictor-section').classList.add('active');
        document.querySelector('.tab-button:nth-child(1)').classList.add('active');
    } else {
        document.getElementById('quiz-section').classList.add('active');
        document.querySelector('.tab-button:nth-child(2)').classList.add('active');
    }
}

async function startQuiz() {
    const skill = document.getElementById('quiz-skill').value;
    const level = document.getElementById('quiz-level').value;
    
    if (!skill) {
        alert('Please select a skill');
        return;
    }
    
    try {
        const response = await fetch(`/get_questions?skill=${skill}&level=${level}`);
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Failed to load questions');
            return;
        }
        
        currentQuestions = data.questions;
        currentAnswers = new Array(currentQuestions.length).fill(-1);
        currentQuestionIndex = 0;
        
        document.getElementById('quiz-setup').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('quiz-result').style.display = 'none';
        document.getElementById('submit-btn').style.display = 'inline-block';
        document.getElementById('reset-btn').style.display = 'none';
        
        displayQuestion();
    } catch (error) {
        alert('Error starting quiz: ' + error.message);
    }
}

function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const questionsDiv = document.getElementById('quiz-questions');
    
    let optionsHTML = '';
    question.options.forEach((option, index) => {
        const isChecked = currentAnswers[currentQuestionIndex] === index ? 'checked' : '';
        optionsHTML += `
            <label class="option-label">
                <input type="radio" name="option" value="${index}" ${isChecked} onchange="currentAnswers[${currentQuestionIndex}] = ${index}; updateProgress();">
                <span>${option}</span>
            </label>
        `;
    });
    
    questionsDiv.innerHTML = `
        <div class="question">
            <h3>${question.question}</h3>
            <div class="options">
                ${optionsHTML}
            </div>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button onclick="previousQuestion()" style="flex: 1; ${currentQuestionIndex === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''};" ${currentQuestionIndex === 0 ? 'disabled' : ''}>Previous</button>
            <button onclick="nextQuestion()" style="flex: 1;">${currentQuestionIndex === currentQuestions.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
    `;
    
    updateProgress();
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        submitQuiz();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

async function submitQuiz() {
    const skill = document.getElementById('quiz-skill').value;
    const level = document.getElementById('quiz-level').value;
    
    try {
        const response = await fetch('/evaluate_quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                skill: skill,
                level: level,
                answers: currentAnswers
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Failed to evaluate quiz');
            return;
        }
        
        // Store quiz results
        lastQuizResult = {
            skill: skill,
            level: level,
            percentage: data.percentage,
            proficiency: data.proficiency,
            correct: data.correct,
            total: data.total
        };
        
        // Display results
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('quiz-result').style.display = 'block';
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('reset-btn').style.display = 'block';
        
        document.getElementById('score-text').textContent = `${data.correct} out of ${data.total}`;
        document.getElementById('percentage-text').textContent = data.percentage;
        document.getElementById('proficiency-text').textContent = data.proficiency;
        
    } catch (error) {
        alert('Error submitting quiz: ' + error.message);
    }
}

function resetQuiz() {
    document.getElementById('quiz-setup').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('reset-btn').style.display = 'none';
    
    document.getElementById('quiz-skill').value = '';
    document.getElementById('quiz-level').value = 'beginner';
    
    currentQuestions = [];
    currentAnswers = [];
    currentQuestionIndex = 0;
}

function useQuizResultsInPredictor() {
    if (!lastQuizResult) {
        alert('No quiz results to use');
        return;
    }
    
    // Map skill names to field values
    const skillMap = {
        'data_analyst': 'data_analyst',
        'data_science': 'data_analyst',  // Treat data science as data analyst for field selection
        'cybersecurity': 'cybersecurity',
        'development': 'development'
    };
    
    const field = skillMap[lastQuizResult.skill] || lastQuizResult.skill;
    const proficiencyScore = Math.ceil((lastQuizResult.percentage / 100) * 10);  // Convert percentage to 1-10 scale
    const experiencePercentage = lastQuizResult.percentage;
    
    // Set field
    document.getElementById('field').value = field;
    toggleAdditionalFields();
    
    // Fill in the quiz-based fields
    document.getElementById('field_knowledge').value = proficiencyScore;
    document.getElementById('experience').value = experiencePercentage;
    
    // Optional: Auto-fill other fields with reasonable defaults
    if (!document.getElementById('study_hours').value) {
        document.getElementById('study_hours').value = proficiencyScore;
    }
    if (!document.getElementById('attendance').value) {
        document.getElementById('attendance').value = (proficiencyScore / 10) * 100;
    }
    if (!document.getElementById('assignments').value) {
        document.getElementById('assignments').value = (proficiencyScore / 10) * 100;
    }
    if (!document.getElementById('participation').value) {
        document.getElementById('participation').value = proficiencyScore;
    }
    if (!document.getElementById('skills_score').value) {
        document.getElementById('skills_score').value = proficiencyScore;
    }
    
    // Switch to predictor tab
    switchTab('predictor');
    
    // Show success message
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'background: rgba(124, 179, 66, 0.3); border: 2px solid #7cb342; color: #c8e6c9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;';
    msgDiv.textContent = `✓ Quiz results applied! Field Knowledge: ${proficiencyScore}/10, Experience: ${experiencePercentage}%`;
    document.getElementById('predict-form').parentElement.insertBefore(msgDiv, document.getElementById('predict-form'));
    
    setTimeout(() => msgDiv.remove(), 5000);
}
