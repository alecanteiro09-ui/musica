export type OrderStatus =
  | "draft"
  | "lyric_generated"
  | "song_generating"
  | "preview_ready"
  | "paid"
  | "delivered"
  | "failed"
  | "expired";

export type VoicePreference = "masculina" | "feminina" | "dupla";

export type VoiceCloneStatus =
  | "none"
  | "sample_submitted"
  | "awaiting_phrase"
  | "awaiting_reading"
  | "processing"
  | "ready"
  | "failed";

/** Respostas coletadas no wizard /criar, antes de existir um pedido no banco. */
export interface WizardAnswers {
  relationship: string;
  nickname: string;
  occasion: string;
  genre: string;
  voicePreference: VoicePreference;
  story: string;
  funDetail: string;
  chorusHint: string;
  buyerName: string;
  buyerEmail: string;
  wantsCustomVoice: boolean;
  /** Tom emocional opcional (romântica, divertida, emocionante, animada...). */
  mood: string;
  /** Nomes que a pessoa quer citados na letra (ex: filhos), separados por vírgula. Opcional. */
  namesToInclude: string;
}

export interface Order {
  id: string;
  buyer_token: string;
  gift_token: string;
  buyer_email: string | null;
  buyer_name: string | null;
  relationship: string | null;
  recipient_nickname: string | null;
  occasion: string | null;
  genre: string | null;
  voice_preference: VoicePreference | null;
  story: string | null;
  fun_detail: string | null;
  chorus_hint: string | null;
  status: OrderStatus;
  price_cents: number;
  currency: string;
  mood: string | null;
  names_to_include: string | null;
  wants_custom_voice: boolean;
  wants_photo_pdf: boolean;
  photo_pdf_frame_size: string | null;
  photo_pdf_source_url: string | null;
  voice_status: VoiceCloneStatus;
  voice_task_id: string | null;
  voice_id: string | null;
  voice_error: string | null;
  created_at: string;
  updated_at: string;
}

export type PhotoPdfStatus = "pending_payment" | "paid" | "generating" | "ready" | "failed";

export interface PhotoPdfOrder {
  id: string;
  order_id: string;
  frame_size: string;
  source_photo_url: string;
  status: PhotoPdfStatus;
  amount_cents: number;
  generated_image_url: string | null;
  pdf_path: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export type LyricKind = "chorus_option" | "full_lyric";
export type LyricSource = "ai" | "user_edited";

export interface OrderLyric {
  id: string;
  order_id: string;
  kind: LyricKind;
  version: number;
  content: string;
  is_selected: boolean;
  is_current: boolean;
  source: LyricSource;
  created_at: string;
}

export type TrackVariant = "take_1" | "take_2";
export type TrackStatus = "queued" | "processing" | "ready" | "failed";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface OrderTrack {
  id: string;
  order_id: string;
  provider: string;
  provider_job_id: string | null;
  variant: TrackVariant;
  status: TrackStatus;
  full_audio_path: string | null;
  duration_seconds: number | null;
  word_timestamps: WordTimestamp[] | null;
  created_at: string;
}

export interface OrderPhoto {
  id: string;
  order_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export type PaymentStatus = "created" | "pix_generated" | "confirmed" | "expired" | "failed";

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  correlation_id: string;
  charge_id: string | null;
  status: PaymentStatus;
  amount_cents: number;
  pix_qrcode_image_url: string | null;
  pix_copy_paste: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
