import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, email, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const query = email 
      ? { $or: [{ email }, { username }] }
      : { username };

    const existingUser = await User.findOne(query);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const gradients = [
      'from-violet-600 via-purple-600 to-indigo-600',
      'from-blue-600 via-cyan-600 to-teal-600',
      'from-rose-600 via-pink-600 to-purple-600',
      'from-emerald-600 via-teal-600 to-cyan-600',
      'from-orange-600 via-red-600 to-rose-600',
      'from-indigo-600 via-blue-600 to-sky-600'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: email || undefined,
      password: hashedPassword,
      displayName: username, // default display name
      avatarGradient: randomGradient,
    });

    const { password: _, ...userData } = user.toObject();

    return NextResponse.json({ message: 'User created successfully', user: userData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
