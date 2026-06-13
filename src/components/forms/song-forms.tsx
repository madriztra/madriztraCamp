export function UploadSongForm() {
const [message, setMessage] = useState("");
const [ok, setOk] = useState(false);
const [loading, setLoading] = useState(false);

async function handleSubmit(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();

```
setLoading(true);
setMessage("");

try {
  const formData = new FormData(
    event.currentTarget
  );

  const response = await fetch(
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
      result.error ||
        "Upload failed"
    );
  }

  setOk(true);
  setMessage(
    "Song uploaded successfully."
  );

  event.currentTarget.reset();

  window.location.reload();
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
```

}

return ( <Card> <CardHeader> <CardTitle>
Upload audio </CardTitle>

```
    <CardDescription>
      Store audio and cover
      art in S3-compatible
      storage.
    </CardDescription>
  </CardHeader>

  <CardContent>
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 md:grid-cols-2"
    >
      {/* BIARKAN SEMUA INPUT
         YANG SUDAH ADA
         TETAP SAMA */}

      <div className="flex flex-col gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border px-4 py-2"
        >
          {loading
            ? "Uploading..."
            : "Upload song"}
        </button>

        <FormMessage
          ok={ok}
          message={message}
        />
      </div>
    </form>
  </CardContent>
</Card>
```

);
}
