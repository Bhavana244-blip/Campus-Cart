import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import Logo from '../../components/ui/Logo';
import { ChevronDown, X } from 'lucide-react-native';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'Mech', 'Civil', 'IT', 'Biomedical', 'Chemical', 'Architecture', 'MBA', 'MCA', 'Pharmacy', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year', 'PhD'];

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !department || !year || !registrationNumber) {
      setError('Please fill out all fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Intentionally insert profile rows using the data gathered
        const { error: profileError } = await supabase.from('users').insert({
          auth_user_id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
          department,
          year,
          registration_number: registrationNumber.trim(),
        });
        
        if (profileError) {
          setError(profileError.message);
          setIsLoading(false);
          return;
        }

        // Redirection is now handled by RootLayout's useEffect
      } else {
        setIsLoading(false);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const renderSelectModal = (visible: boolean, close: () => void, data: string[], onSelect: (val: string) => void, title: string) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={close}><X size={24} color={Colors.primary} /></TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => { onSelect(item); close(); }}>
                <Text style={styles.modalOptionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Logo size={48} />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join CampusCart today.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, error && !fullName ? styles.inputError : null]}
            placeholder="John Doe"
            value={fullName}
            onChangeText={(text) => { setFullName(text); setError(''); }}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={[styles.input, error && !registrationNumber ? styles.inputError : null]}
            placeholder="RA2111003010xxx"
            value={registrationNumber}
            onChangeText={(text) => { setRegistrationNumber(text); setError(''); }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Dropdowns */}
        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDeptModal(true)}>
              <Text style={[styles.dropdownText, !department && styles.placeholderText]} numberOfLines={1}>
                {department || 'Select'}
              </Text>
              <ChevronDown size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Year</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowYearModal(true)}>
              <Text style={[styles.dropdownText, !year && styles.placeholderText]} numberOfLines={1}>
                {year || 'Select'}
              </Text>
              <ChevronDown size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>SRM Email</Text>
          <TextInput
            style={[styles.input, error && !email ? styles.inputError : null]}
            placeholder="ab1234@srmist.edu.in"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, error && !password ? styles.inputError : null]}
            placeholder="Create a secure password"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, isLoading || !fullName || !email || !password || !department || !year || !registrationNumber ? styles.buttonDisabled : null]} 
          onPress={handleSignup}
          disabled={isLoading || !fullName || !email || !password || !department || !year || !registrationNumber}
          activeOpacity={0.8}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </TouchableOpacity>
        
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkHighlight}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderSelectModal(showDeptModal, () => setShowDeptModal(false), DEPARTMENTS, setDepartment, 'Select Department')}
      {renderSelectModal(showYearModal, () => setShowYearModal(false), YEARS, setYear, 'Select Year')}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 28,
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 16,
    color: Colors.muted,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Sora_400Regular',
    color: Colors.primary,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Sora_400Regular',
    color: Colors.primary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.muted,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.danger,
    marginBottom: 20,
    marginTop: -8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
  },
  linkHighlight: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: Colors.primary,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 16,
    color: Colors.primary,
  },
});
