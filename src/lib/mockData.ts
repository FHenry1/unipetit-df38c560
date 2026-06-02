export type Role = "user" | "owner";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface SnackBar {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  location: string;
  rating: number;
  categories: string[];
  cover: string;
  menu_items: MenuItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  favorites: string[];
}

export const CATEGORIES = [
  { id: "burger", label: "Hambúrguer", emoji: "🍔" },
  { id: "hotdog", label: "Hot Dog", emoji: "🌭" },
  { id: "pastel", label: "Pastel", emoji: "🥟" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "drinks", label: "Bebidas", emoji: "🥤" },
  { id: "sweets", label: "Doces", emoji: "🍩" },
];

export const INITIAL_USERS: User[] = [
  {
    id: "u1",
    name: "Maria Consumidora",
    email: "user@unipetit.com",
    password: "password123",
    role: "user",
    favorites: [],
  },
  {
    id: "u2",
    name: "João Dono",
    email: "owner@lanchonete.com",
    password: "password123",
    role: "owner",
    favorites: [],
  },
];

export const INITIAL_SNACKBARS: SnackBar[] = [
  {
    id: "s1",
    owner_id: "u2",
    name: "Burger do João",
    description: "Hambúrgueres artesanais com pão brioche e ingredientes frescos.",
    location: "Rua das Flores, 123 — Centro",
    rating: 4.8,
    categories: ["burger", "drinks"],
    cover:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    menu_items: [
      {
        id: "m1",
        name: "Cheese Burger Clássico",
        description: "Blend 160g, cheddar, alface e tomate",
        price: 24.9,
      },
      {
        id: "m2",
        name: "Bacon Lover",
        description: "Blend 180g, bacon crocante, cheddar e barbecue",
        price: 29.9,
      },
      {
        id: "m3",
        name: "Refrigerante Lata",
        description: "Coca-Cola, Guaraná ou Sprite 350ml",
        price: 6.5,
      },
    ],
  },
  {
    id: "s2",
    owner_id: "owner-other",
    name: "Pastelaria da Esquina",
    description: "Pastéis crocantes de massa fina, recheios variados.",
    location: "Av. Paulista, 900",
    rating: 4.6,
    categories: ["pastel", "drinks"],
    cover:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80",
    menu_items: [
      {
        id: "m4",
        name: "Pastel de Carne",
        description: "Massa crocante, carne moída temperada",
        price: 9.5,
      },
      {
        id: "m5",
        name: "Pastel de Queijo",
        description: "Muçarela derretida",
        price: 8.5,
      },
    ],
  },
  {
    id: "s3",
    owner_id: "owner-other",
    name: "Dog House",
    description: "Hot dogs gourmet com molhos artesanais.",
    location: "Rua do Sol, 45",
    rating: 4.4,
    categories: ["hotdog"],
    cover:
      "https://images.unsplash.com/photo-1612392062798-2dfbd4c66d96?w=800&q=80",
    menu_items: [
      {
        id: "m6",
        name: "Dog Especial",
        description: "Salsicha, purê, batata palha e milho",
        price: 14.9,
      },
    ],
  },
  {
    id: "s4",
    owner_id: "owner-other",
    name: "Pizza Express",
    description: "Pizzas no forno a lenha, massa fininha.",
    location: "Rua Itália, 200",
    rating: 4.7,
    categories: ["pizza"],
    cover:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80",
    menu_items: [
      {
        id: "m7",
        name: "Margherita",
        description: "Molho, muçarela e manjericão",
        price: 39.9,
      },
    ],
  },
];
