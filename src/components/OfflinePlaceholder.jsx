// GUI category: Common. Shows connection_lost.png when backend is unreachable.
// Used in OrdersScreen and DashboardScreen empty states.
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const OFFLINE_IMG = require('../../connection_lost.png');

/**
 * @param {object} props
 * @param {string}  props.title    — main heading
 * @param {string}  props.subtitle — explanation text
 * @param {boolean} props.compact  — smaller version for inline use
 */
export default function OfflinePlaceholder({ title, subtitle, compact = false }) {
  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {/* ── Connection Lost Image ── */}
      <Image
        source={OFFLINE_IMG}
        style={[styles.offlineImage, compact && styles.offlineImageCompact]}
        resizeMode="contain"
      />

      {/* ── Text ── */}
      <Text style={[styles.title, compact && styles.titleCompact]}>
        {title || 'Backend Unreachable'}
      </Text>
      <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
        {subtitle || 'The server appears to be offline.\nPull down to retry when connection is restored.'}
      </Text>

      {/* Retry hint */}
      <View style={styles.hintRow}>
        <Ionicons name="refresh-outline" size={14} color={COLORS.mutedText} />
        <Text style={styles.hintText}>Pull down to refresh</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  wrapperCompact: {
    paddingVertical: 24,
  },
  offlineImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  offlineImageCompact: {
    width: 140,
    height: 140,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde6cf',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
});
