// store/formStore.ts
import { create } from 'zustand';

export type Platform = "twitter" | "linkedin" | "facebook" | "instagram";
export type Model = "gemini" | "deepseek";
export type Tone = "professional" | "casual" | "enthusiastic" | "informative" | "humorous" | "serious";
export type ImageSize = "square" | "portrait" | "landscape" | "twitter";

// Post form state
interface PostFormState {
  platform: Platform;
  topic: string;
  model: Model;
  tone: Tone;
  keyPoints: string[];
  includeHashtags: boolean;
  includeEmojis: boolean;
  maxLength: number | undefined;
  result: string;
}
 
// Image form state
interface ImageFormState {
  platform: Platform;
  prompt: string;
  size: ImageSize;
  style: string;
  contentId: number | null;
  result: {
    imageBase64: string;
    mimeType: string;
    altText: string;
  } | null;
}

// YouTube form state
interface YouTubeFormState {
  videoTitle: string;
  videoDescription: string;
  videoTags: string[];
  privacyStatus: 'private' | 'public' | 'unlisted';
  videoFile: File | null;
  thumbnailFile: File | null;
}

// UI state
interface UIState {
  showImageForm: boolean;
  showPostForm: boolean;
  isLoading: boolean;
  error: string;
}

// Combined store state
interface FormStoreState extends UIState {
  post: PostFormState;
  image: ImageFormState;
  youtube: YouTubeFormState; // Add YouTube form state
  selectedPlatforms: string[]; // Add selectedPlatforms to the state
  setSelectedPlatforms: (platforms: string[]) => void; // Add setter for selectedPlatforms
  
  // UI actions
  setShowImageForm: (value: boolean) => void;
  setShowPostForm: (value: boolean) => void;
  toggleImageForm: () => void;
  togglePostForm: () => void;
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  
  // Post form actions
  setPostPlatform: (value: Platform) => void;
  setTopic: (value: string) => void;
  setModel: (value: Model) => void;
  setTone: (value: Tone) => void;
  setKeyPoints: (value: string[]) => void;
  setIncludeHashtags: (value: boolean) => void;
  setIncludeEmojis: (value: boolean) => void;
  setMaxLength: (value: number | undefined) => void;
  setPostResult: (value: string) => void;
  
  // Image form actions
  setImagePlatform: (value: Platform) => void;
  setPrompt: (value: string) => void;
  setSize: (value: ImageSize) => void;
  setStyle: (value: string) => void;
  setContentId: (value: number | null) => void;
  setImageResult: (value: { imageBase64: string; mimeType: string; altText: string; } | null) => void;

  // YouTube form actions
  setYouTubeData: (data: Partial<YouTubeFormState>) => void;
}

const useFormStore = create<FormStoreState>((set) => ({
  // UI initial state
  showImageForm: false,
  showPostForm: false,
  isLoading: false,
  error: "",
  
  // Post form initial state
  post: {
    platform: "twitter",
    topic: "",
    model: "gemini",
    tone: "professional",
    keyPoints: [],
    includeHashtags: true,
    includeEmojis: true,
    maxLength: undefined,
    result: "",
  },
  
  // Image form initial state
  image: {
    platform: "instagram",
    prompt: "",
    size: "square",
    style: "",
    contentId: null,
    result: null,
  },

  // YouTube form initial state
  youtube: {
    videoTitle: '',
    videoDescription: '',
    videoTags: [],
    privacyStatus: 'private',
    videoFile: null,
    thumbnailFile: null,
  },
  
  selectedPlatforms: [], // Initialize selectedPlatforms as an empty array
  setSelectedPlatforms: (platforms: string[]) => {
    console.log("setSelectedPlatforms called with:", platforms);
    set({ selectedPlatforms: platforms });
  },
  
  // UI actions
  setShowImageForm: (value: boolean) => {
    console.log("setShowImageForm called with:", value);
    set({ showImageForm: value });
  },
  setShowPostForm: (value: boolean) => {
    console.log("setShowPostForm called with:", value);
    set({ showPostForm: value });
  },
  toggleImageForm: () => {
    console.log("toggleImageForm called");
    set((state) => ({ showImageForm: !state.showImageForm }));
  },
  togglePostForm: () => {
    console.log("togglePostForm called");
    set((state) => ({ showPostForm: !state.showPostForm }));
  },
  setLoading: (value: boolean) => {
    console.log("setLoading called with:", value);
    set({ isLoading: value });
  },
  setError: (value: string) => {
    console.log("setError called with:", value);
    set({ error: value });
  },
  
  // Post form actions
  setPostPlatform: (value: Platform) => {
    console.log("setPostPlatform called with:", value);
    set((state) => ({ post: { ...state.post, platform: value } }));
  },
  setTopic: (value: string) => {
    console.log("setTopic called with:", value);
    set((state) => ({ post: { ...state.post, topic: value } }));
  },
  setModel: (value: Model) => {
    console.log("setModel called with:", value);
    set((state) => ({ post: { ...state.post, model: value } }));
  },
  setTone: (value: Tone) => {
    console.log("setTone called with:", value);
    set((state) => ({ post: { ...state.post, tone: value } }));
  },
  setKeyPoints: (value: string[]) => {
    console.log("setKeyPoints called with:", value);
    set((state) => ({ post: { ...state.post, keyPoints: value } }));
  },
  setIncludeHashtags: (value: boolean) => {
    console.log("setIncludeHashtags called with:", value);
    set((state) => ({ post: { ...state.post, includeHashtags: value } }));
  },
  setIncludeEmojis: (value: boolean) => {
    console.log("setIncludeEmojis called with:", value);
    set((state) => ({ post: { ...state.post, includeEmojis: value } }));
  },
  setMaxLength: (value: number | undefined) => {
    console.log("setMaxLength called with:", value);
    set((state) => ({ post: { ...state.post, maxLength: value } }));
  },
  setPostResult: (value: string) => {
    console.log("setPostResult called with:", value);
    set((state) => ({ post: { ...state.post, result: value } }));
  },
  
  // Image form actions
  setImagePlatform: (value: Platform) => {
    console.log("setImagePlatform called with:", value);
    set((state) => ({ image: { ...state.image, platform: value } }));
  },
  setPrompt: (value: string) => {
    console.log("setPrompt called with:", value);
    set((state) => ({ image: { ...state.image, prompt: value } }));
  },
  setSize: (value: ImageSize) => {
    console.log("setSize called with:", value);
    set((state) => ({ image: { ...state.image, size: value } }));
  },
  setStyle: (value: string) => {
    console.log("setStyle called with:", value);
    set((state) => ({ image: { ...state.image, style: value } }));
  },
  setContentId: (value: number | null) => {
    console.log("setContentId called with:", value);
    set((state) => ({ image: { ...state.image, contentId: value } }));
  },
  setImageResult: (value: { imageBase64: string; mimeType: string; altText: string; } | null) => {
    console.log("setImageResult called with:", value);
    set((state) => ({ image: { ...state.image, result: value } }));
  },

  setYouTubeData: (data: Partial<YouTubeFormState>) => {
    console.log("setYouTubeData called with:", data);
    set((state) => ({ youtube: { ...state.youtube, ...data } }));
  },
}));

export default useFormStore;