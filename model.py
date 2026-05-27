import joblib
import os
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Use absolute path to ensure model loads from correct location
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'student_success_model.joblib')


def train_and_save_model():
    # Increased features: 4 original + 3 additional
    X, y = make_classification(
        n_samples=1000,
        n_features=7,
        n_informative=7,
        n_redundant=0,
        n_clusters_per_class=1,
        class_sep=1.2,
        random_state=42,
    )
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(random_state=42)
    model.fit(X_train, y_train)
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    try:
        return joblib.load(MODEL_PATH)
    except Exception:
        return train_and_save_model()


def predict_student_success(model, features):
    prediction = model.predict([features])[0]
    importances = model.feature_importances_
    return 'Likely to Pass' if prediction == 1 else 'Needs Improvement', importances


def get_feature_names():
    return ['Study Hours', 'Attendance', 'Assignments', 'Participation', 'Field Knowledge', 'Experience', 'Skills Score']



if __name__ == '__main__':
    train_and_save_model()
