import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Image, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { CATEGORIES, CONDITIONS } from '../constants/categories';
import { LOCATIONS } from '../constants/locations';
import { XP_RULES, calculateLevel } from '../lib/gamify';
import { X, ImagePlus, Trash2, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useListingsStore } from '../stores/listingsStore';
import SemesterPicker from './ui/SemesterPicker';
import Toast from './ui/Toast';

const { width } = Dimensions.get('window');

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  price: z.number().min(1, 'Price must be at least 1').max(1000000, 'Price too high'),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description too long'),
  semester: z.number().min(1).max(8).optional(),
  is_swap_enabled: z.boolean(),
  swap_wants: z.string().max(200).optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface PostListingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostListingModal({ visible, onClose }: PostListingModalProps) {
  const { appUser, session, setAppUser } = useAuthStore();
  
  const [activeMode, setActiveMode] = useState<'SINGLE' | 'BUNDLE'>('SINGLE');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: '', message: '', type: 'info' as any });
  const [bundleItems, setBundleItems] = useState<string[]>([]);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      price: undefined,
      category: '',
      condition: '',
      location: '',
      description: '',
      semester: undefined,
      is_swap_enabled: false,
      swap_wants: '',
    }
  });

  // Price Suggestion Debounce
  const [debouncedTitle, setDebouncedTitle] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Accessing form value for title
      // We'll watch the title field below
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const titleValue = React.useRef('');
  const handleTitleChange = async (val: string, onChange: any) => {
    onChange(val);
    titleValue.current = val;
    
    if (val.length > 5) {
       // Search similar items in Supabase for price suggestion
       const { data, error } = await supabase
         .from('listings')
         .select('price')
         .ilike('title', `%${val}%`)
         .limit(10);
         
       if (data && data.length > 0) {
          const avg = data.reduce((acc, curr) => acc + curr.price, 0) / data.length;
          setSuggestedPrice(Math.round(avg / 10) * 10);
       } else {
          setSuggestedPrice(null);
       }
    } else {
       setSuggestedPrice(null);
    }
  };

  const pickImages = async () => {
    if (images.length >= 5) {
      showToast('Maximum 5 images allowed', '', 'error');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission needed', 'We need access to your gallery to upload images.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newUris].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      showToast('Maximum 5 images allowed', '', 'error');
      return;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      showToast('Permission needed', 'We need access to your camera to take photos.', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setToastMsg({ title, message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const uploadImages = async (listingId: string) => {
    if (!appUser) return [];
    
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const uri = images[i];
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const response = await fetch(manipResult.uri);
        const blob = await response.blob();
        
        const userId = session?.user?.id || appUser.auth_user_id;
        const path = `${userId}/${listingId}/${i}.jpg`;
        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(path);

        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error('Image upload error:', err);
      }
    }
    
    return uploadedUrls;
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!appUser) return;

    if (images.length === 0) {
      showToast('Photo required', 'Please add at least 1 photo of the item', 'error');
      return;
    }

    setIsUploading(true);

    try {
      if (activeMode === 'SINGLE') {
        const { data: newListing, error: insertError } = await supabase
          .from('listings')
          .insert({
            seller_id: appUser.id,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            condition: data.condition,
            location: data.location,
            semester: data.semester,
            is_swap_enabled: data.is_swap_enabled,
            swap_wants: data.swap_wants,
            images: [],
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        const imageUrls = await uploadImages(newListing.id);
        if (imageUrls.length > 0) {
          await supabase.from('listings').update({ images: imageUrls }).eq('id', newListing.id);
        }
      } else {
        // Bundle Creation
        const { data: newBundle, error: bError } = await supabase
          .from('bundles')
          .insert({
            seller_id: appUser.id,
            title: data.title,
            description: data.description,
            bundle_price: data.price,
            savings: suggestedPrice ? Math.max(0, suggestedPrice * 1.2 - data.price) : 0,
            images: [],
          })
          .select('id')
          .single();

        if (bError) throw bError;
        const imageUrls = await uploadImages(newBundle.id);
        if (imageUrls.length > 0) {
          await supabase.from('bundles').update({ images: imageUrls }).eq('id', newBundle.id);
        }
        
        // Link bundle items (if implemented)
      }

      showToast('Success!', activeMode === 'SINGLE' ? 'Item listed successfully' : 'Bundle created successfully', 'success');
      
      // XP Reward Logic
      if (appUser) {
        const newXp = (appUser.xp || 0) + XP_RULES.POST_LISTING;
        const newLevel = calculateLevel(newXp);
        
        setAppUser({
          ...appUser,
          xp: newXp,
          level: newLevel,
        });
        
        showToast('Level Up!', `You earned ${XP_RULES.POST_LISTING} XP for your listing!`, 'success');
      }

      reset();
      setImages([]);
      setBundleItems([]);
      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 1500);

    } catch (error: any) {
      setIsUploading(false);
      showToast('Error', error.message || 'Failed to post listing.', 'error');
    }
  };

  const renderDropdown = (name: any, options: string[], placeholder: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{placeholder}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {options.filter(o => o !== 'All').map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, value === opt && styles.chipActive]}
                onPress={() => onChange(opt)}
              >
                <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors[name as keyof ListingFormData] && <Text style={styles.errorText}>{errors[name as keyof ListingFormData]?.message}</Text>}
        </View>
      )}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
          <View style={styles.tabContainer}>
             <TouchableOpacity 
               style={[styles.modeTab, activeMode === 'SINGLE' && styles.modeTabActive]} 
               onPress={() => setActiveMode('SINGLE')}
             >
                <Text style={[styles.modeTabText, activeMode === 'SINGLE' && styles.modeTabTextActive]}>Item</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.modeTab, activeMode === 'BUNDLE' && styles.modeTabActive]} 
               onPress={() => setActiveMode('BUNDLE')}
             >
                <Text style={[styles.modeTabText, activeMode === 'BUNDLE' && styles.modeTabTextActive]}>Bundle</Text>
             </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.postHeaderBtn} activeOpacity={0.7} onPress={handleSubmit(onSubmit)} disabled={isUploading}>
            {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postText}>Post Now</Text>}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Photo Upload Section */}
          <View style={styles.imageSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollContent}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageThumbnailContainer}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <TouchableOpacity style={styles.deleteThumbnailBtn} onPress={() => removeImage(idx)}>
                    <Trash2 size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {images.length < 5 && (
                <>
                  <TouchableOpacity style={styles.addImageBtn} onPress={takePhoto}>
                    <Camera size={32} color={Colors.primary} />
                    <Text style={styles.addImageText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.addImageBtn, { borderStyle: 'solid' }]} onPress={pickImages}>
                    <ImagePlus size={32} color={Colors.muted} />
                    <Text style={styles.addImageText}>Gallery</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{activeMode === 'SINGLE' ? 'Item Title' : 'Bundle Title'}</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder={activeMode === 'SINGLE' ? "e.g. Minimalist Desk Lamp" : "e.g. Freshman Essentials Pack"}
                  value={value}
                  onChangeText={(val) => handleTitleChange(val, onChange)}
                  maxLength={100}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
              </View>
            )}
          />

          <View style={styles.priceRow}>
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Price (₹)</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError, { fontSize: 24, fontFamily: 'Sora_700Bold', color: Colors.accent }]}
                    placeholder="0"
                    value={value ? value.toString() : ''}
                    onChangeText={(text) => onChange(parseInt(text.replace(/[^0-9]/g, ''), 10) || undefined)}
                    keyboardType="numeric"
                  />
                  {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
                </View>
              )}
            />

            {suggestedPrice && (
              <TouchableOpacity 
                style={styles.suggestionCard}
                onPress={() => setValue('price', suggestedPrice)}
              >
                 <Text style={styles.suggestionLabel}>Suggested Price</Text>
                 <Text style={styles.suggestionValue}>₹{suggestedPrice}</Text>
                 <Text style={styles.suggestionTip}>Tap to apply</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeMode === 'SINGLE' && (
            <Controller
              control={control}
              name="semester"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Target Semester (Optional)</Text>
                  <SemesterPicker 
                    selectedSemester={value || null} 
                    onSelect={onChange} 
                  />
                </View>
              )}
            />
          )}

          {activeMode === 'SINGLE' && (
            <Controller
              control={control}
              name="is_swap_enabled"
              render={({ field: { onChange, value } }) => (
                <View style={styles.swapSection}>
                  <View style={styles.swapHeader}>
                    <View>
                      <Text style={styles.label}>Enable Barter/Swap</Text>
                      <Text style={styles.swapSubtitle}>Accept other items instead of cash</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggle, value && styles.toggleActive]}
                      onPress={() => onChange(!value)}
                    >
                       <View style={[styles.toggleHandle, value && styles.toggleHandleActive]} />
                    </TouchableOpacity>
                  </View>
                  
                  {value && (
                    <Controller
                      control={control}
                      name="swap_wants"
                      render={({ field: { onChange: onWantsChange, value: wantsValue } }) => (
                        <TextInput
                          style={[styles.input, { marginTop: 12, height: 60 }]}
                          placeholder="What do you want in exchange? (e.g. Scientific Calculator)"
                          value={wantsValue}
                          onChangeText={onWantsChange}
                          multiline
                        />
                      )}
                    />
                  )}
                </View>
              )}
            />
          )}

          {renderDropdown('category', CATEGORIES, 'Category')}
          {renderDropdown('condition', CONDITIONS, 'Condition')}
          
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Campus Location</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {LOCATIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, value === opt && styles.chipActive]}
                      onPress={() => onChange(opt)}
                    >
                      <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Description</Text>
                  <Text style={styles.charCount}>{value?.length || 0}/1000</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  placeholder="Describe the item, features, and reason for selling..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  textAlignVertical="top"
                />
                {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
              </View>
            )}
          />
        </ScrollView>
        
        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Posting Listing...</Text>
          </View>
        )}
      </SafeAreaView>
      <Toast visible={toastVisible} title={toastMsg.title} message={toastMsg.message} type={toastMsg.type} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 3,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  cancelText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#6D6E9C',
  },
  postHeaderBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  postText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 3,
    width: 140,
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: '#6D6E9C',
  },
  modeTabTextActive: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 28,
  },
  suggestionCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: 16,
    padding: 12,
    width: 130,
    height: 80,
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  suggestionLabel: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 9,
    color: '#166534',
    textTransform: 'uppercase',
  },
  suggestionValue: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 20,
    color: Colors.accent,
  },
  suggestionTip: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
    color: '#16a34a',
  },
  swapSection: {
    backgroundColor: '#FAF5FF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DDD6FE',
    marginBottom: 28,
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swapSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#6D6E9C',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 4,
  },
  toggleActive: {
    backgroundColor: Colors.accent,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleHandleActive: {
    transform: [{ translateX: 22 }],
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
  },
  imageSection: {
    marginBottom: 28,
  },
  imageScrollContent: {
    gap: 14,
  },
  addImageBtn: {
    width: 110,
    height: 110,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addImageText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#6D6E9C',
    marginTop: 8,
  },
  imageThumbnailContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteThumbnailBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  inputContainer: {
    marginBottom: 28,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: '#1E1B4B',
    marginBottom: 10,
  },
  charCount: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#9EA0C1',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Sora_500Medium',
    color: '#1E1B4B',
  },
  textArea: {
    minHeight: 140,
    paddingTop: 18,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: Colors.danger,
    marginTop: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DDD6FE',
    marginRight: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  chipText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#6D6E9C',
  },
  chipTextActive: {
    color: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 18,
    color: Colors.primary,
    marginTop: 20,
  },
});
