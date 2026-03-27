import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Image, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { CATEGORIES, CONDITIONS } from '../constants/categories';
import { LOCATIONS } from '../constants/locations';
import { X, ImagePlus, Trash2, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useListingsStore } from '../stores/listingsStore';
import Toast from './ui/Toast';

const { width } = Dimensions.get('window');

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  price: z.number().min(1, 'Price must be at least 1').max(1000000, 'Price too high'),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description too long'),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface PostListingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostListingModal({ visible, onClose }: PostListingModalProps) {
  const { appUser, session } = useAuthStore();
  
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: '', message: '', type: 'info' as any });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      price: undefined,
      category: '',
      condition: '',
      location: '',
      description: '',
    }
  });

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
      // 1. Create a listing ID first (just generate a UUID or let Supabase do it by inserting empty text first, then update)
      // Or we let supabase auto-generate via insert and return the data! Wait, we need listingId for the image path.
      
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
          images: [], // temporary empty array
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      
      // 2. Upload images
      const imageUrls = await uploadImages(newListing.id);
      
      // 3. Update listing with image URLs
      if (imageUrls.length > 0) {
        await supabase
          .from('listings')
          .update({ images: imageUrls })
          .eq('id', newListing.id);
      }

      showToast('Success!', 'Your item is now listed on CampusCart.', 'success');
      reset();
      setImages([]);
      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 1500);

    } catch (error: any) {
      setIsUploading(false);
      showToast('Error', error.message || 'Failed to post listing. Please try again.', 'error');
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
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Post a Listing</Text>
          <TouchableOpacity style={styles.postHeaderBtn} activeOpacity={0.7} onPress={handleSubmit(onSubmit)} disabled={isUploading}>
            {isUploading ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={styles.postText}>Post</Text>}
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
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                  <Camera size={32} color={Colors.muted} />
                  <Text style={styles.addImageText}>{images.length}/5</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="e.g. Minimalist Desk Lamp"
                  value={value}
                  onChangeText={onChange}
                  maxLength={100}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  cancelText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 16,
    color: Colors.muted,
  },
  postHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.tagBackground,
    borderRadius: 20,
  },
  postText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.accent,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageScrollContent: {
    gap: 12,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  addImageText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 8,
  },
  imageThumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteThumbnailBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  charCount: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Sora_400Regular',
    color: Colors.primary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.muted,
  },
  chipTextActive: {
    color: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
    marginTop: 16,
  },
});
