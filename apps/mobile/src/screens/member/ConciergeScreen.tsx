import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { apiGet, apiPost } from '../../lib/api';
import { getStoredSession } from '../../lib/auth';
import { brand } from '../../lib/brand';

const CATEGORIES = [
  'Electronics', 'Automobiles', 'Travel & Hospitality',
  'Jewellery & Watches', 'Real Estate', 'Fashion & Lifestyle',
  'Home & Interiors', 'Other',
];

const TIMELINES = ['Urgent – Within 24 hours', 'This week', 'Within 2 weeks', 'This month', 'No rush'];

interface ConciergeRequest {
  id: string;
  request_ref: string;
  category: string;
  brand_preference: string | null;
  budget_max_inr: number | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA726', in_progress: '#26C6DA', confirmed: '#4CAF50', delivered: '#4CAF50',
};

export function ConciergeScreen() {
  const [tab, setTab] = useState<'new' | 'history'>('new');

  // Form state
  const [category, setCategory]   = useState('');
  const [brandPref, setBrandPref] = useState('');
  const [budget, setBudget]       = useState('');
  const [timeline, setTimeline]   = useState('');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  // History state
  const [requests, setRequests]     = useState<ConciergeRequest[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  async function loadHistory() {
    setHistLoading(true);
    try {
      const token = await getStoredSession();
      const res = await apiGet<{ success: boolean; data?: { requests: ConciergeRequest[] } }>(
        '/api/concierge', token ?? undefined
      );
      setRequests(res.data?.requests ?? []);
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  }

  async function handleSubmit() {
    if (!category) { Alert.alert('Required', 'Please select a category.'); return; }
    if (!timeline) { Alert.alert('Required', 'Please select a timeline.'); return; }
    if (notes.trim().length < 20) { Alert.alert('Required', 'Notes must be at least 20 characters.'); return; }

    setSubmitting(true);
    try {
      const token = await getStoredSession();
      const body: Record<string, unknown> = { category, timeline, notes: notes.trim() };
      if (brandPref.trim()) body.brand_preference = brandPref.trim();
      const budgetNum = parseFloat(budget.replace(/[₹,\s]/g, ''));
      if (!isNaN(budgetNum)) body.budget_max_inr = budgetNum;

      const res = await apiPost<{ success: boolean; data?: { request_ref: string } }>(
        '/api/concierge', body, token ?? undefined
      );
      if (!res.success) throw new Error('Submission failed');
      setSubmittedRef(res.data?.request_ref ?? '');
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCategory(''); setBrandPref(''); setBudget('');
    setTimeline(''); setNotes(''); setSubmitted(false); setSubmittedRef('');
  }

  return (
    <View style={styles.wrapper}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['new', 'history'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'new' ? 'New Request' : 'My Requests'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'new' ? (
        submitted ? (
          <View style={styles.successContainer}>
            <Text style={styles.successCheck}>✓</Text>
            <Text style={styles.successTitle}>Request Submitted!</Text>
            <Text style={styles.successRef}>{submittedRef}</Text>
            <Text style={styles.successSub}>Our concierge will call within 24 hours.</Text>
            <TouchableOpacity style={styles.btn} onPress={resetForm}>
              <Text style={styles.btnText}>Submit Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.formContent}>
              <Field label="Category *">
                <View style={styles.chipsWrap}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]}
                      onPress={() => setCategory(c)}>
                      <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
              <Field label="Brand / Product">
                <TextInput style={styles.input} placeholder="e.g. BMW X5, Rolex Submariner"
                  placeholderTextColor="#555" value={brandPref} onChangeText={setBrandPref} />
              </Field>
              <Field label="Budget (approx.)">
                <TextInput style={styles.input} placeholder="e.g. ₹5,00,000"
                  placeholderTextColor="#555" value={budget} onChangeText={setBudget} keyboardType="numeric" />
              </Field>
              <Field label="Timeline *">
                <View style={styles.chipsWrap}>
                  {TIMELINES.map((t) => (
                    <TouchableOpacity key={t} style={[styles.chip, timeline === t && styles.chipActive]}
                      onPress={() => setTimeline(t)}>
                      <Text style={[styles.chipText, timeline === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
              <Field label={`Notes * (${notes.length}/1000, min 20)`}>
                <TextInput style={[styles.input, { height: 100 }]} placeholder="Specific requirements, colour, city..."
                  placeholderTextColor="#555" value={notes} onChangeText={setNotes}
                  multiline textAlignVertical="top" maxLength={1000} />
              </Field>
              <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                {submitting
                  ? <ActivityIndicator color="#0A0A12" />
                  : <Text style={styles.btnText}>Submit Request</Text>}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.formContent}>
          {histLoading ? (
            <ActivityIndicator color={brand.primaryColor} style={{ marginTop: 40 }} />
          ) : requests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No concierge requests yet.</Text>
            </View>
          ) : (
            requests.map((r) => (
              <View key={r.id} style={styles.histCard}>
                <View style={styles.histHeader}>
                  <Text style={styles.histRef}>{r.request_ref}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[r.status] ?? '#888') + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[r.status] ?? '#888' }]}>
                      {r.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.histCategory}>{r.category}{r.brand_preference ? ` · ${r.brand_preference}` : ''}</Text>
                {r.budget_max_inr != null && (
                  <Text style={styles.histBudget}>Budget: ₹{r.budget_max_inr.toLocaleString('en-IN')}</Text>
                )}
                <Text style={styles.histDate}>
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { flex: 1, backgroundColor: '#0A0A12' },
  tabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  tab:          { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: brand.primaryColor },
  tabText:      { color: '#666666', fontSize: 14, fontWeight: '600' },
  tabTextActive:{ color: brand.primaryColor },
  formContent:  { padding: 20, paddingBottom: 40 },
  fieldLabel:   { color: '#cccccc', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 14,
  },
  chipsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  chipActive:   { backgroundColor: brand.primaryColor + '22', borderColor: brand.primaryColor },
  chipText:     { color: '#888888', fontSize: 12, fontWeight: '600' },
  chipTextActive:{ color: brand.primaryColor },
  btn:          { backgroundColor: brand.primaryColor, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText:      { color: '#0A0A12', fontSize: 15, fontWeight: '700' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCheck: { color: brand.primaryColor, fontSize: 56, marginBottom: 16 },
  successTitle: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  successRef:   { color: brand.primaryColor, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  successSub:   { color: '#888888', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  histCard: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 10,
  },
  histHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  histRef:      { color: brand.primaryColor, fontSize: 13, fontWeight: '700' },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  histCategory: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  histBudget:   { color: '#888888', fontSize: 13, marginBottom: 4 },
  histDate:     { color: '#555555', fontSize: 12 },
  emptyBox:     { alignItems: 'center', paddingTop: 60 },
  emptyText:    { color: '#666666', fontSize: 14 },
});
