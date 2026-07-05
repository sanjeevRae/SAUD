export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images?: string[];
  description: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  rating: number;
  reviewCount?: number;
  stock?: number;
  tag?: string;
  linkHref?: string;
  enabled?: boolean;
  featuredOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalPath?: string;
};

export type Collection = {
  id: string;
  title: string;
  image: string;
  productId?: string;
  linkHref?: string;
};

export type Testimonial = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
};

export const products: Product[] = [
  {
    id: '1',
    name: "Women's Ribbed Cutout Knit Top (Blue)",
    price: 41,
    category: 'Knitwear',
    image: '/product_01.jpg',
    images: ['/product_01.jpg', '/product_08.jpg', '/product_09.jpg'],
    description: 'Soft ribbed knit top with delicate button details. Crafted from premium cotton blend for all-day comfort.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Blue', hex: '#A8C8DC' }, { name: 'Cream', hex: '#F5F0E8' }, { name: 'Grey', hex: '#9E9E9E' }],
    rating: 4.5,
    reviewCount: 128,
    stock: 45,
  },
  {
    id: '2',
    name: 'Lace Long-Sleeve Midi Dress (Cream)',
    price: 132.5,
    category: 'Dresses',
    image: '/product_02.jpg',
    images: ['/product_02.jpg', '/product_01.jpg', '/product_04.jpg'],
    description: 'Elegant lace midi dress with long sleeves. Perfect for special occasions or elevated everyday wear.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Cream', hex: '#F5F0E8' }, { name: 'Black', hex: '#1A1A1A' }],
    rating: 4.8,
    reviewCount: 86,
    stock: 23,
  },
  {
    id: '3',
    name: "Men's Striped Polo Shirt (Navy)",
    price: 24,
    originalPrice: 32,
    category: 'Polo',
    image: '/product_03.jpg',
    images: ['/product_03.jpg', '/product_07.jpg', '/product_09.jpg'],
    description: 'Classic striped polo in breathable cotton pique. A timeless staple for any wardrobe.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Navy', hex: '#1E3A5F' }, { name: 'White', hex: '#FFFFFF' }],
    rating: 4.3,
    reviewCount: 215,
    stock: 89,
  },
  {
    id: '4',
    name: 'Grey Long-sleeve Pleated Dress (Grey)',
    price: 94,
    category: 'Dresses',
    image: '/product_04.jpg',
    images: ['/product_04.jpg', '/product_02.jpg', '/product_08.jpg'],
    description: 'Sophisticated pleated dress with waist belt. Fluid silhouette that moves beautifully.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Grey', hex: '#7A7A7A' }, { name: 'Black', hex: '#1A1A1A' }],
    rating: 4.6,
    reviewCount: 64,
    stock: 31,
  },
  {
    id: '5',
    name: 'Urban Shadow Hoodie',
    price: 125,
    category: 'Knitwear',
    image: '/product_05.jpg',
    images: ['/product_05.jpg', '/product_09.jpg', '/product_07.jpg'],
    description: 'Loose-fit sweatshirt hoodie in medium weight cotton-blend fabric. Jersey-lined with drawstring hood and kangaroo pocket.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Burgundy', hex: '#722F37' }, { name: 'Black', hex: '#1A1A1A' }, { name: 'Grey', hex: '#808080' }],
    rating: 4.7,
    reviewCount: 342,
    stock: 67,
    tag: 'Best Seller',
  },
  {
    id: '6',
    name: 'Canvas Day Bag (Brown)',
    price: 132,
    category: 'Accessories',
    image: '/product_06.jpg',
    images: ['/product_06.jpg', '/product_05.jpg', '/product_07.jpg'],
    description: 'Premium leather duffle bag crafted from high-quality materials. Durable and built for everyday use.',
    sizes: ['One Size'],
    colors: [{ name: 'Brown', hex: '#8B6914' }, { name: 'Black', hex: '#1A1A1A' }],
    rating: 4.9,
    reviewCount: 156,
    stock: 18,
  },
  {
    id: '7',
    name: 'Urban Wool Overcoat (Charcoal)',
    price: 320,
    category: 'Outerwear',
    image: '/product_07.jpg',
    images: ['/product_07.jpg', '/product_09.jpg', '/product_05.jpg'],
    description: 'Double-breasted wool overcoat in premium charcoal blend. Tailored fit with structured shoulders.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Charcoal', hex: '#36454F' }, { name: 'Navy', hex: '#1E3A5F' }],
    rating: 4.8,
    reviewCount: 92,
    stock: 15,
    tag: 'Premium',
  },
  {
    id: '8',
    name: 'Soft Knit Cardigan (Beige)',
    price: 145,
    category: 'Knitwear',
    image: '/product_08.jpg',
    images: ['/product_08.jpg', '/product_01.jpg', '/product_02.jpg'],
    description: 'Cable-knit cardigan in soft cashmere blend. Relaxed fit perfect for layering.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Beige', hex: '#F5F5DC' }, { name: 'Grey', hex: '#808080' }],
    rating: 4.4,
    reviewCount: 178,
    stock: 42,
  },
  {
    id: '9',
    name: 'Olive Chunky Cardigan',
    price: 98,
    category: 'Knitwear',
    image: '/product_09.jpg',
    images: ['/product_09.jpg', '/product_05.jpg', '/product_08.jpg'],
    description: 'Chunky knit cardigan in olive green. Oversized fit with button closure and ribbed cuffs.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Olive', hex: '#556B2F' }, { name: 'Beige', hex: '#F5F5DC' }],
    rating: 4.5,
    reviewCount: 134,
    stock: 56,
  },
  {
    id: '10',
    name: 'Relaxed Tailored Blazer (Taupe)',
    price: 215,
    category: 'Outerwear',
    image: '/collection_01.jpg',
    images: ['/collection_01.jpg', '/collection_05.jpg', '/collection_02.jpg'],
    description: 'Single-breasted blazer in premium taupe wool blend. Structured yet relaxed silhouette.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Taupe', hex: '#B8A99A' }, { name: 'Navy', hex: '#1E3A5F' }, { name: 'Black', hex: '#1A1A1A' }],
    rating: 4.7,
    reviewCount: 203,
    stock: 28,
    tag: 'Signature',
  },
];

export const collections: Collection[] = [
  { id: '1', title: 'Urban Minimalist', image: '/collection_01.jpg' },
  { id: '2', title: 'Evening Noir', image: '/collection_02.jpg' },
  { id: '3', title: 'Golden Hour', image: '/collection_03.jpg' },
  { id: '4', title: 'Casual Essence', image: '/collection_04.jpg' },
  { id: '5', title: 'Modern Classic', image: '/collection_05.jpg' },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Mina Gurung',
    avatar: 'https://instagram.fktm20-1.fna.fbcdn.net/v/t51.82787-15/541532702_18420566713100822_1111252167365514616_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=104&ig_cache_key=MzcxMzM2MzI1Mzg3OTk4MTA0MQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=fiTHHfEKNoQQ7kNvwG5g7GF&_nc_oc=Adq61_lIk8RyePmdZr3d8m85eaEC8CFQhFEUgBZ3Y1JJjC6ZxBnStntsFApvO3aHN6sXnUXKquj80XG9l598GAVD&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fktm20-1.fna&_nc_gid=Z0tgkJmYNNLVpEr93oJCMg&_nc_ss=7a22e&oh=00_Af_Dv77LzqKY8OrLOJH60x6AOI_GWikxx4kgswBqQOZ48Q&oe=6A2D886B',
    rating: 4.9,
    text: 'The fit feels very flattering and the pieces are easy to mix and match with other items in my wardrobe. Quality that truly lasts.',
    date: '2 days ago',
  },
  {
    id: '2',
    name: 'Jenish Shrestha',
    avatar: 'https://instagram.fktm20-1.fna.fbcdn.net/v/t51.82787-15/621547354_18035399258546742_8539803489467538773_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=106&ig_cache_key=MjcwNjAzNDcwMjI1MjkwMzE3Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=oDSYQU5a6QIQ7kNvwEpI1Fg&_nc_oc=AdrGXfJaxQGS-6oXBM7I6COvYJRDXqOXGHrYKXmt8DCN_5HumcErnJ5kL7PRlnNQtxIjKCjiJfrxv0aK6vamKT4I&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fktm20-1.fna&_nc_gid=neoagZOHJ_om2dknVq8GGA&_nc_ss=7a22e&oh=00_Af-aVdwhh6kmaSh97qvDuytUIa5kYxmDAki0OXALIZEUKg&oe=6A2D7EC1',
    rating: 4.9,
    text: 'The fit feels considered, like it was tailored without the tailor. Minimal branding, maximum quality. Exactly what I wanted.',
    date: '1 week ago',
  },
  {
    id: '3',
    name: 'Messi',
    avatar: 'https://instagram.fktm20-1.fna.fbcdn.net/v/t51.82787-15/701173544_18662574595033891_4860241982652239223_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=1&ig_cache_key=Mzg5NjkyNDAyNjM3Mzc4MDg1Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMzA3Mi5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=bRZIGdLAo8kQ7kNvwHrsqII&_nc_oc=AdrWfkz-i4wAkD2UkRuUTuv3U0DF0zXxUV5rDuS4rCTAdTAnqXBADGeFskZ0ERJhgxUxkG4Q1ZGqkEdJ4yP5nPVp&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fktm20-1.fna&_nc_gid=HZnkEIHL-lIzjfcOK3hx6A&_nc_ss=7a22e&oh=00_Af87ZpkkD4qmXX0BzOv8zxDmrdOt3kI2cExoqkyILITZBQ&oe=6A2DA3C7',
    rating: 4.9,
    text: 'I now own three pairs of the trousers. That says everything. The fabric comfort is unmatched in this price range.',
    date: '2 weeks ago',
  },
  {
    id: '4',
    name: 'Karina',
    avatar: 'https://instagram.fktm20-1.fna.fbcdn.net/v/t51.82787-15/712943992_17998747202976805_7040069593676432233_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_cat=1&ig_cache_key=MzkxMDQwNzc4Mzc4NjQ3Nzc4NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMzAyNC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=LLB-fOrvZn4Q7kNvwGmlBRg&_nc_oc=Adrud9bY1O0O24rj54TvtYEAAjBC9iYaU1d_6RNsUx8pmlAvKGirCrQJHX-b4Bbd5-DQkRmBIyJg60iBgfw78r0L&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fktm20-1.fna&_nc_gid=p-z1AyPNeI-y7WW78dv5Dg&_nc_ss=7a22e&oh=00_Af8t5E3Csg7PNNETOCvyrgG0mLPRjDjOuZop04NunSCQMA&oe=6A2D88F5',
    rating: 4.9,
    text: 'The fit feels very flattering and the pieces are easy to mix and match with other items in my wardrobe.',
    date: '3 weeks ago',
  },
  {
    id: '5',
    name: 'Eunchae ',
    avatar: 'https://instagram.fktm20-1.fna.fbcdn.net/v/t51.82787-15/572800330_17888208258378726_3747073210088231597_n.webp?_nc_cat=106&ig_cache_key=Mzc1OTE4ODEzMjQ3NTU5Njg1Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=NcM8ImRvRMgQ7kNvwFfU34f&_nc_oc=AdprYhwjNGfZhC7U211BSdGrlZTM0UBN9g6iwoHNw1L6ODlsFgqq-IWvctFivgj8AhMjmlwKG3N_wLhDlgsDTYFV&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fktm20-1.fna&_nc_gid=1bq0OqJgJqZNgw2CjWufVg&_nc_ss=7a22e&oh=00_Af8tGOvjyxrZbYRi_v7wuSt2U2hAtich0c-2cpMuX-OHlw&oe=6A2E2547',
    rating: 4.8,
    text: 'The silhouettes feel modern without being loud. I can dress them up for work and still wear them on weekends.',
    date: '1 month ago',
  },
  {
    id: '6',
    name: 'Wonyoung ',
    avatar: 'https://preview.redd.it/240109-jang-wonyoung-instagram-update-v0-1by307c1xdbc1.jpg?width=1080&crop=smart&auto=webp&s=ee8860eec92f5f578f5b21baad1974370e8dbf9a',
    rating: 4.9,
    text: 'Every piece feels intentional. The fabric, color, and fit make simple outfits look much more polished.',
    date: '1 month ago',
  },
];

export const categories = [
  { name: 'T-Shirt', stock: 120, image: '/category_tshirt.jpg' },
  { name: 'Knitwear', stock: 72, image: '/category_knitwear.jpg' },
  { name: 'Cami', stock: 14, image: '/category_cami.jpg' },
  { name: 'Polo', stock: 52, image: '/category_polo.jpg' },
];

export const curatedPicks = [
  { id: '1', name: 'Relaxed Tailored Trouser', price: 98 },
  { id: '2', name: 'Cotton Twill Shirt', price: 74 },
  { id: '3', name: 'Canvas Day Bag', price: 132 },
];

export const filterCategories = ['All', 'Knitwear', 'Dresses', 'T-Shirt', 'Cami', 'Polo'];


