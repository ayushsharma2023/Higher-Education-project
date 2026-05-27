from flask import Flask, render_template, request, jsonify
from model import load_model, predict_student_success, get_feature_names

app = Flask(__name__)
model = load_model()
feature_names = get_feature_names()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Please provide prediction data.'}), 400
    
    # Validate required fields
    required_fields = ['study_hours', 'attendance', 'assignments', 'participation', 'field_knowledge', 'experience', 'skills_score']
    for field in required_fields:
        if field not in data or data.get(field) == '':
            return jsonify({'error': f'Please provide a value for {field}.'}), 400
    
    try:
        study_hours = float(data.get('study_hours'))
        attendance = float(data.get('attendance'))
        assignments = float(data.get('assignments'))
        participation = float(data.get('participation'))
        field_knowledge = float(data.get('field_knowledge'))
        experience = float(data.get('experience'))
        skills_score = float(data.get('skills_score'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Please enter valid numbers for all fields.'}), 400

    features = [study_hours, attendance, assignments, participation, field_knowledge, experience, skills_score]
    prediction, importances = predict_student_success(model, features)

    # Create pie chart data
    pie_data = []
    for name, imp in zip(feature_names, importances):
        pie_data.append({'label': name, 'value': round(imp * 100, 2)})

    # Suggestion: improve the feature with lowest value
    if features:
        min_index = features.index(min(features))
        suggestion = f"Consider improving: {feature_names[min_index]}"
    else:
        suggestion = "Enter your details to get recommendations"

    return jsonify({
        'prediction': prediction,
        'pie_data': pie_data,
        'suggestion': suggestion
    })

if __name__ == '__main__':
    app.run(debug=True)
