import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [stock, setStock] = useState([]);
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      const saved = await AsyncStorage.getItem('freezer_stock');
      if (saved) setStock(JSON.parse(saved));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('freezer_stock', JSON.stringify(stock));
  }, [stock]);

  function handleBarCodeScanned({ data }) {
    setScanning(false);
    addProduct(data, '');
  }

  function addProduct(code, name) {
    const id = code || Date.now().toString();
    const existing = stock.find(p => p.id === id);
    if (existing) {
      setStock(stock.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));
    } else {
      setStock([...stock, { id, name: name || `Product ${id}`, qty: 1 }]);
    }
    setManualName('');
  }

  function removeProduct(id) {
    setStock(stock.map(p => p.id === id ? { ...p, qty: Math.max(0, p.qty - 1) } : p).filter(p => p.qty > 0));
  }

  if (hasPermission === null) {
    return <Text>Vraag toestemming voor camera...</Text>;
  }
  if (hasPermission === false) {
    return <Text>Geen toegang tot camera</Text>;
  }

  if (scanning) {
    return (
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Freezer Stock Manager</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Productnaam handmatig"
          value={manualName}
          onChangeText={setManualName}
        />
        <Button title="Voeg toe" onPress={() => manualName && addProduct(null, manualName)} />
      </View>

      <Button title="Scan barcode" onPress={() => setScanning(true)} />

      <FlatList
        style={{ marginTop: 20, width: '100%' }}
        data={stock}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.qty}>x{item.qty}</Text>
            <TouchableOpacity onPress={() => removeProduct(item.id)} style={styles.removeBtn}>
              <Text style={{ color: 'white' }}>-1</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f0f0f0' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 10, borderRadius: 6, backgroundColor: 'white' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'white', marginBottom: 10, borderRadius: 8 },
  itemText: { fontSize: 16 },
  qty: { fontSize: 16, fontWeight: 'bold' },
  removeBtn: { backgroundColor: 'red', padding: 6, borderRadius: 4 }
});
