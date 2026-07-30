# Mobile Sensor Behavioral Biometric Identification

A machine learning system that identifies users based on their motion behavior captured by mobile device sensors — accelerometer, gyroscope, magnetometer, gravity, rotation, and user acceleration.

## Overview

| Metric | Value |
|--------|-------|
| **Best Model** | Random Forest (GridSearchCV tuned) |
| **CV Accuracy** | 94.7% (5-fold Stratified CV) |
| **Per-User Range** | 53.3% – 100% (11 users at 100%) |
| **Features Engineered** | ~609 |
| **Features Selected** | 200 (via Mutual Information) |
| **Training Sessions** | 300 (20 users × 15 sessions) |
| **Test Sessions** | 96 |
| **Mean Prediction Confidence** | 65.8% |

## Business Applications

- **Fraud Prevention** — Detect unauthorized device usage in real-time
- **Passive Authentication** — Continuously verify user identity without explicit login
- **Behavioral Monitoring** — Track deviations from baseline user patterns
- **Risk-Based Auth** — Step-up verification for uncertain sessions

## Dataset

The dataset contains timestamped sensor readings from 6 sensor types collected during mobile device usage sessions.

| Sensor Type | ID | Description | Unit |
|-------------|-----|-------------|------|
| Gyroscope | 1 | Angular velocity | rad/s |
| Accelerometer | 2 | Acceleration with gravity | m/s² |
| Gravity | 4 | Direction of gravity | m/s² |
| Magnetometer | 5 | Magnetic field | µT |
| Rotation | 6 | Device orientation vector | — |
| User Acceleration | 19 | Linear acceleration (no gravity) | m/s² |

- **Training**: 2.3M+ sensor readings across 300 sessions, 20 users
- **Test**: 96 sessions for prediction
- **Balance**: Exactly 15 sessions per user — no class imbalance

## Methodology

### Pipeline

```
Raw Sensor Data (2.3M rows)
        ↓  PySpark ingestion + deduplication
Per-Session Feature Extraction (~609 features)
        ↓  StandardScaler + Mutual Information (top 200)
Model Training (5-fold Stratified CV)
        ↓  GridSearchCV hyperparameter tuning
Final Predictions (96 test sessions)
```

### Feature Engineering

| Category | Count | Description |
|----------|-------|-------------|
| **Statistical** | 198 | Mean, std, min/max, range, percentiles, IQR, skewness, kurtosis |
| **Magnitude** | 78 | Rotation-invariant signal magnitude (RMS, energy, range) |
| **Temporal** | 162 | Autocorrelation, zero-crossing rate, jerk (1st/2nd derivative) |
| **Frequency (FFT)** | 126 | Dominant frequency, spectral entropy, band power |
| **Cross-sensor** | ~45 | Pairwise Pearson correlation across sensor pairs |

Each session is reduced to a single feature vector for classification.

### Models Compared

| Model | CV Accuracy |
|-------|-------------|
| **Random Forest** *(best)* | **94.7%** |
| Logistic Regression | 92.3% |
| LightGBM | ~90% |
| XGBoost | ~89% |

### Key Findings

- **Top features**: `acc_mag_rms`, `acc_mag_mean`, `acc_mag_median` — movement intensity is the strongest discriminator
- **Sensor importance**: Magnetometer (23.8%) > Accelerometer (23.3%) > Gravity (18.6%) > Gyroscope (18.0%)
- **11 of 20 users** are identified with 100% accuracy
- **2 difficult users** (User 1: 53.3%, User 0: 86.7%) overlap behaviorally with others
- Accelerometer samples at ~28 Hz; other sensors at ~11–12 Hz

## Project Structure

```
.
├── behavioral-biometric-identification.ipynb   # Main analysis notebook
├── requirements-minimal.txt                    # Python dependencies
├── results_presentation.pptx                   # Results slide deck
└── README.md
```

> **Data** (`data_sample 1/`) and **outputs** (`output/`) are excluded from version control.

## Setup & Usage

### Install dependencies

```bash
pip install -r requirements-minimal.txt
```

### Run the notebook

Open `behavioral-biometric-identification.ipynb` in Jupyter or VS Code and run all cells.

The notebook expects the data directory at `data_sample 1/train.csv` and `data_sample 1/test.csv`. Outputs (feature CSVs, visualizations, `submission.csv`) are written to `output/`.

### Requirements

| Package | Purpose |
|---------|---------|
| `pyspark` | Scalable data loading and statistical feature extraction |
| `numpy`, `pandas`, `scipy` | Numerical computing and signal processing |
| `scikit-learn` | ML pipeline, feature selection, model evaluation |
| `xgboost`, `lightgbm` | Gradient boosted tree baselines |
| `matplotlib`, `seaborn` | Visualization |

## Results

### Model Performance

- **94.7% cross-validated accuracy** on 300 training sessions across 20 users
- Prediction confidence on test set: mean 65.8%, range 17.1% – 94.5%
- Risk breakdown: **17 HIGH**, 52 MEDIUM, 27 LOW confidence predictions

### EDA Highlights

- No significant outliers — sensor values are within physical limits
- 0.81% duplicate rows removed (data collection artifacts)
- Sessions vary from ~12s to ~784s (median ~71s); model uses normalized per-session features
- No domain shift between train and test distributions

## Future Work

1. **Deep Learning** — LSTM / Transformer for raw sequence modeling
2. **Edge Deployment** — Quantize model for on-device, privacy-preserving inference
3. **Multi-modal Fusion** — Add GPS, app usage, typing dynamics
4. **Continuous Learning** — Online adaptation to behavioral drift
5. **User Calibration** — Per-user fine-tuning for difficult cases
