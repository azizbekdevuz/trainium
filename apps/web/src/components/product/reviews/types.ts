export type ReviewItem = {
  id: string;
  user: { id: string; name?: string | null; image?: string | null; email?: string | null };
  rating: number;
  title?: string | null;
  body: string;
  likes: { id: string }[];
  createdAt: string;
  replies: ReviewItem[];
  editedAt?: string | null;
  deletedLocal?: boolean;
  _count?: { replies?: number };
};

