set dotenv-load := false

read_files := ".env,.env.defaults,data.json"
write_files := "data.json"

defualt: run

run:
    @deno run \
        --allow-net=0.0.0.0 \
        --allow-read={{read_files}} \
        --allow-write={{write_files}} \
        main.ts

compile:
    @deno compile \
        --allow-net=0.0.0.0 \
        --allow-read={{read_files}} \
        --allow-write={{write_files}} \
        main.ts
