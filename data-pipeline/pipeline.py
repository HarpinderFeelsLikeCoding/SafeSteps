import apache_beam as beam
from transforms import TransformAccidentData

def run_pipeline():
    with beam.Pipeline() as p:
        (p | 'ReadCSV' >> beam.io.ReadFromText('gs://your-data/accidents.csv')
           | 'Parse' >> beam.Map(lambda x: parse_csv(x))
           | 'AddEmbeddings' >> beam.ParDo(TransformAccidentData())
           | 'WriteToMongo' >> beam.io.WriteToMongoDb(
                uri='mongodb+srv://user:pass@cluster.mongodb.net',
                db='safesteps',
                coll='accidents'))