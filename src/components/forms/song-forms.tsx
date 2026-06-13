"use client";

import { useActionState } from "react";

import { importSpotifySong, uploadSong, type SongActionState } from "@/actions/songs";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SongActionState = { ok: false, message: "" };

export function ImportSongForm() {
  const [state, formAction] = useActionState(importSpotifySong, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from Spotify</CardTitle>
        <CardDescription>Fetch title, artist, cover, release date, duration, album, and genre.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Spotify URL</Label>
            <Input id="url" name="url" type="url" placeholder="https://open.spotify.com/track/..." required />
          </div>
          <SubmitButton>Import song</SubmitButton>
          <FormMessage ok={state.ok} message={state.message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function UploadSongForm() {
  const [state, formAction] = useActionState(uploadSong, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload audio</CardTitle>
        <CardDescription>Store audio and cover art in S3-compatible storage.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artist</Label>
            <Input id="artist" name="artist" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="album">Album</Label>
            <Input id="album" name="album" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input id="genre" name="genre" placeholder="pop, r&b, indie" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audio">Audio</Label>
            <Input id="audio" name="audio" type="file" accept="audio/*" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover">Cover</Label>
            <Input id="cover" name="cover" type="file" accept="image/*" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="spotify">Spotify</Label>
            <Input id="spotify" name="spotify" type="url" placeholder="https://open.spotify.com/track/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appleMusic">Apple Music</Label>
            <Input id="appleMusic" name="appleMusic" type="url" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soundCloud">SoundCloud</Label>
            <Input id="soundCloud" name="soundCloud" type="url" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeMusic">YouTube Music</Label>
            <Input id="youtubeMusic" name="youtubeMusic" type="url" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deezer">Deezer</Label>
            <Input id="deezer" name="deezer" type="url" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amazonMusic">Amazon Music</Label>
            <Input id="amazonMusic" name="amazonMusic" type="url" />
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <SubmitButton>Upload song</SubmitButton>
            <FormMessage ok={state.ok} message={state.message} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
