import sys
import json
import torch
import torch.nn as nn
import numpy as np
#MLP
class Net(nn.Module):
    def __init__(self, input_size, output_size):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(input_size, 128)
        self.dropout1 = nn.Dropout(0.25)
        self.fc2 = nn.Linear(128, 256)
        self.dropout2 = nn.Dropout(0.25)
        self.fc3 = nn.Linear(256, 128)
        self.dropout3 = nn.Dropout(0.25)
        self.fc4 = nn.Linear(128, output_size)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.dropout1(x)
        x = torch.relu(self.fc2(x))
        x = self.dropout2(x)
        x = torch.relu(self.fc3(x))
        x = self.dropout3(x)
        x = self.fc4(x)
        return x

def train(model, criterion, optimizer, inputs_tensor, labels_tensor, epochs=300):
    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(inputs_tensor)
        loss = criterion(outputs, labels_tensor)
        loss.backward()
        optimizer.step()

def main():
    torch.manual_seed(42)
    np.random.seed(42)
    raw_data = sys.stdin.read()
    data = json.loads(raw_data)
    inputs = data['inputs']
    labels = data['labels']
    
    inputs_tensor = torch.tensor(inputs, dtype=torch.float32)
    labels_tensor = torch.tensor(labels, dtype=torch.float32)

    if inputs_tensor.shape[0] != labels_tensor.shape[0]:
        min_size = min(inputs_tensor.shape[0], labels_tensor.shape[0])
        inputs_tensor = inputs_tensor[:min_size]
        labels_tensor = labels_tensor[:min_size]
    
    model = Net(2, 10)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    train(model, criterion, optimizer, inputs_tensor, labels_tensor)
    
    model.eval()
    with torch.no_grad():
        predictions = model(inputs_tensor)
        predictions = torch.relu(predictions) 
        predictions_mean = predictions.mean(0).tolist()
        elements = ['C', 'Si', 'Mn', 'Mg', 'Cu', 'Ni', 'Mo', 'V', 'Co', 'Sb']
        prediction_results = [{'name': element, 'value': pred} for element, pred in zip(elements, predictions_mean)]

    print(json.dumps(prediction_results))

if __name__ == '__main__':
    main()