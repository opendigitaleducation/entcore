db.sessions.createIndex( { "flagTTL": 1 }, { expireAfterSeconds: 60 } )