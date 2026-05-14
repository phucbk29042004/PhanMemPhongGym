import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';
import { unwrapData } from '../../utils/data';

export default function MemberQRCodeScreen() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const qrImageUrl = useMemo(() => {
    if (!qrData?.token) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrData.token)}`;
  }, [qrData?.token]);

  const fetchQr = async () => {
    try {
      setErrorText('');
      const res = await api.get('/checkin/my-qr');
      setQrData(unwrapData(res, null));
    } catch (error) {
      setErrorText(error.response?.data?.message || 'Không tải được mã QR từ backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQr();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQr(); }} colors={['#1D9336']} />}
    >
      <Text style={styles.title}>QR Check-in</Text>
      <Text style={styles.subtitle}>Mã được cấp bởi API /checkin/my-qr và có thời hạn ngắn.</Text>

      {loading ? <ActivityIndicator color="#1D9336" size="large" /> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      {qrData ? (
        <View style={styles.card}>
          <ProfileAvatar uri={qrData.avatar_url} name={qrData.ho_ten} size={64} />
          <Text style={styles.name}>{qrData.ho_ten}</Text>
          <Text style={styles.code}>{qrData.ma_ho_so}</Text>
          {qrImageUrl ? <Image source={{ uri: qrImageUrl }} style={styles.qrImage} /> : null}
          <Text style={styles.ttl}>Hết hạn sau {qrData.het_han_sau_phut} phút</Text>
          <TouchableOpacity style={styles.button} onPress={fetchQr}>
            <Text style={styles.buttonText}>Làm mới QR</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: '#f7f9ff', padding: 20, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#5c6758', marginBottom: 18 },
  error: { color: '#dc2626', fontWeight: '600', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#ebeef3', padding: 22, alignItems: 'center' },
  name: { color: '#181c20', fontSize: 20, fontWeight: '800', marginTop: 12 },
  code: { color: '#1D9336', fontWeight: '800', marginTop: 4, marginBottom: 18 },
  qrImage: { width: 260, height: 260, backgroundColor: '#f1f4f9', marginBottom: 14 },
  ttl: { color: '#3f4a3c', fontWeight: '600', marginBottom: 16 },
  button: { backgroundColor: '#1D9336', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
