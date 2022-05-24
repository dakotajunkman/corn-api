async function startAuth() {
    const req = {
        method: "POST"
    };

    const res = await fetch("/auth", req);
    const data = await res.json();
    window.location = data.url;
}
