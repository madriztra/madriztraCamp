"use client";

import { useActionState, useState } from "react";

import {
  importSpotifySong,
  type SongActionState,
} from "@/actions/songs";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SongActionState = {
  ok: false,
  message: "",
};

export function ImportSongForm() {
  const [state, formAction] = useActionState(
    importSpotifySong,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Import from Spotify
        </CardTitle>

        <CardDescription>
          Fetch title, artist, cover,
          release date, duration,
          album, and genre.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={formAction}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="url">
              Spotify URL
            </Label>

            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://open.spotify.com/track/..."
              required
            />
          </div>

          <SubmitButton>
            Import song
          </SubmitButton>

          <FormMessage
            ok={state.ok}
            message={state.message}
          />
        </form>
      </CardContent>
    </Card>
  );
}

export function UploadSongForm() {
  const [message, setMessage] =
    useState("");

  const [ok, setOk] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    setLoading(true);
    setMessage("");

    try {
      const formData =
        new FormData(form);

      const response =
        await fetch(
          "/api/songs/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            result.message ??
            "Upload failed"
        );
      }

      setOk(true);

      setMessage(
        result.message ??
          "Song uploaded successfully."
      );

      form.reset();

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setOk(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Upload audio
        </CardTitle>

        <CardDescription>
          Store audio and cover art
          in S3-compatible storage.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
            </Label>

            <Input
              id="title"
              name="title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">
              Artist
            </Label>

            <Input
              id="artist"
              name="artist"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="audio">
              Audio File
            </Label>

            <Input
              id="audio"
              name="audio"
              type="file"
              accept="audio/*"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cover">
              Cover Image
            </Label>

            <Input
              id="cover"
              name="cover"
              type="file"
              accept="image/*"
            />
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <SubmitButton>
              {loading
                ? "Uploading..."
                : "Upload song"}
            </SubmitButton>

            <FormMessage
              ok={ok}
              message={message}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
