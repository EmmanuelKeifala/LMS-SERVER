import {Schema, model, Document, Model} from 'mongoose';

interface FaqItem extends Document {
  question: string;
  answer: string;
}
interface Category extends Document {
  title: string;
}
interface BannerImage extends Document {
  public_id: string;
  url: string;
}

interface Layout extends Document {
  type: string;
  banner: {
    image: BannerImage;
    title: string;
    subTitle: string;
  };
  categories: Category[];
  faqs: FaqItem[];
}

const faqSchema = new Schema<FaqItem>({
  question: {type: String},
  answer: {type: String},
});

const categorySchema = new Schema<Category>({
  title: {type: String},
});

const bannerImageSchema = new Schema<BannerImage>({
  public_id: {type: String},
  url: {type: String},
});

const layoutSchema = new Schema<Layout>({
  type: {type: String},
  faqs: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: bannerImageSchema,
    title: {type: String},
    subTitle: {type: String},
  },
});

const layoutModel = model<Layout>('Layout', layoutSchema);
export default layoutModel;
