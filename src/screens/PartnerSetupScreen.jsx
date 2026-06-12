import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import { COLORS } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

const PartnerSetupScreen = ({ onComplete }) => {
  const [partnerId, setPartnerId] = useState('DP001');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const setPartnerInfo = useAuthStore((s) => s.setPartnerInfo);
  const autoLogin = useAuthStore((s) => s.autoLogin);

  const handleContinue = async () => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (cleanMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    // Save partner info locally
    setPartnerInfo(fullName.trim(), `+91${cleanMobile.slice(-10)}`, partnerId.trim() || 'DP001');

    // Auto-login to get delivery token (backend call)
    await autoLogin(cleanMobile.slice(-10));
    setLoading(false);
    onComplete?.();
  };

  const handleSkip = async () => {
    setLoading(true);
    setPartnerInfo('Delivery Partner', '+919999999999', 'DP001');
    await autoLogin('9999999999');
    setLoading(false);
    onComplete?.();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>AaplaKart</Text>
        <Text style={styles.subtitle}>Delivery Partner Setup</Text>
        <Text style={styles.hint}>Enter your details to start delivering</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Partner ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. DP001"
            placeholderTextColor={COLORS.mutedText}
            value={partnerId}
            onChangeText={setPartnerId}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.mutedText}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mobile Number *</Text>
          <View style={styles.mobileRow}>
            <Text style={styles.cc}>+91</Text>
            <TextInput
              style={styles.mobileInput}
              placeholder="10-digit mobile"
              placeholderTextColor={COLORS.mutedText}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <ActionButton label="Continue to Dashboard" onPress={handleContinue} loading={loading} />

        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip — Use Default Partner</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  logo: { width: 72, height: 72 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.primary, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 13, color: COLORS.mutedText, textAlign: 'center', marginBottom: 28 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border, color: COLORS.text,
  },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cc: {
    fontSize: 16, fontWeight: '800', color: COLORS.text,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  mobileInput: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text,
  },
  skipBtn: { marginTop: 16, alignItems: 'center' },
  skipText: { color: COLORS.mutedText, fontSize: 14, fontWeight: '600' },
});

export default PartnerSetupScreen;
