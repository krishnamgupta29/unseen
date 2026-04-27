import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    const User = mongoose.model('User');
    
    // Attempt to drop the unique index on email
    try {
      await User.collection.dropIndex('email_1');
      return NextResponse.json({ message: 'Successfully dropped the email index. Mongoose will recreate it as sparse now.' });
    } catch (err: any) {
      if (err.codeName === 'IndexNotFound' || err.message.includes('index not found')) {
        return NextResponse.json({ message: 'Index not found, it might have been already dropped or never existed.' });
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
