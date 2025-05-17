from google.cloud import aiplatform

aiplatform.init(project="your-project")

# AutoML training
dataset = aiplatform.TabularDataset.create(
    display_name="pedestrian_risk",
    gcs_source="gs://your-data/training.csv"
)

job = aiplatform.AutoMLTabularTrainingJob.run(
    dataset=dataset,
    target_column="risk_level",
    model_display_name="risk-predictor-v1",
    optimization_objective="MAXIMIZE_AU_ROC"
)