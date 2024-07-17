# one_class_svm_detector.py
import sys
import json
import numpy as np
from sklearn.svm import OneClassSVM
from sklearn.impute import SimpleImputer

data_json = sys.stdin.read()
data = json.loads(data_json)

values = np.array(data['values']).reshape(-1, 1)
values[values == '#NV'] = np.nan 
values = values.astype(float) 
imputer = SimpleImputer(strategy='mean') 
values = imputer.fit_transform(values)
times = data['times']

nu = float(sys.argv[1])
#gamma = sys.argv[2] if sys.argv[2] != 'auto' else 'scale'
kernel = sys.argv[2]

#model = OneClassSVM(nu=nu, gamma=gamma, kernel=kernel)
model = OneClassSVM(nu=nu, kernel=kernel)
model.fit(values)

predictions = model.predict(values)
anomalies = [{"time": times[i], "anomalyValue": values[i][0]} for i in range(len(predictions)) if predictions[i] == -1]
normals = [{"time": times[i], "normalValue": values[i][0]} for i in range(len(predictions)) if predictions[i] == 1]

results = {"anomalies": anomalies, "normals": normals}
print(json.dumps(results))
