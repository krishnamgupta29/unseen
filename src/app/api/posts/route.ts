import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const posts = await Post.find({}).populate('profileId', 'username displayName avatarGradient').sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { content, type, userId, waveform, duration } = await req.json();

    if (!content || !userId) {
      return NextResponse.json({ error: 'Missing content or userId' }, { status: 400 });
    }

    const post = await Post.create({
      content,
      type,
      profileId: userId,
      waveform,
      duration,
    });

    // Update user post count
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
