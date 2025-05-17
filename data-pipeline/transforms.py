import vertexai.language_models as lm
from datetime import datetime

vertexai.init(project="your-project")
embedding_model = lm.TextEmbeddingModel.from_pretrained("textembedding-gecko@001")

def parse_csv(row):
    """Convert raw CSV row to Python dict"""
    return {
        'crash_date': datetime.strptime(row['CRASH DATE'], '%m/%d/%Y'),
        'crash_time': row['CRASH TIME'],
        'borough': row['BOROUGH'],
        'location': {
            'type': 'Point',
            'coordinates': [float(row['LONGITUDE']), float(row['LATITUDE'])]
        },
        'pedestrians_injured': int(row['NUMBER OF PEDESTRIANS INJURED']),
        'contributing_factors': [
            row[f'CONTRIBUTING FACTOR VEHICLE {i}'] 
            for i in range(1,6) 
            if row[f'CONTRIBUTING FACTOR VEHICLE {i}'] not in ['', 'Unspecified']
        ]
    }

def add_embeddings(element):
    """Generate embeddings for vector search"""
    factors_text = ' '.join(element['contributing_factors'])
    element['factors_embedding'] = embedding_model.get_embeddings([factors_text])[0].values
    element['risk_score'] = min(element['pedestrians_injured'] * 0.2, 1.0)  # Simple risk score
    return element