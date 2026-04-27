import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { followerId, targetId } = await req.json();

    if (!followerId || !targetId) {
      return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    if (followerId === targetId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const [follower, target] = await Promise.all([
      User.findById(followerId),
      User.findById(targetId),
    ]);

    if (!follower || !target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = follower.following.includes(targetId);

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.findByIdAndUpdate(followerId, { 
          $pull: { following: targetId },
          $inc: { followingCount: -1 }
        }),
        User.findByIdAndUpdate(targetId, { 
          $pull: { followers: followerId },
          $inc: { followersCount: -1 }
        }),
      ]);
      return NextResponse.json({ message: 'Unfollowed successfully', following: false });
    } else {
      // Follow
      await Promise.all([
        User.findByIdAndUpdate(followerId, { 
          $push: { following: targetId },
          $inc: { followingCount: 1 }
        }),
        User.findByIdAndUpdate(targetId, { 
          $push: { followers: followerId },
          $inc: { followersCount: 1 }
        }),
      ]);
      return NextResponse.json({ message: 'Followed successfully', following: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
