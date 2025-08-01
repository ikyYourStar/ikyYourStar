const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
// Menggunakan variabel lingkungan untuk port, ideal untuk hosting
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS sebagai template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fungsi untuk download TikTok (tidak ada perubahan pada logika)
async function tiktokDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      function formatNumber(integer) {
        let numb = parseInt(integer);
        return Number(numb).toLocaleString().replace(/,/g, ".");
      }

      function formatDate(n, locale = "id") {
        let d = new Date(n * 1000);
        return d.toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        });
      }

      let domain = "https://www.tikwm.com/api/";
      let res = await (
        await axios.post(
          domain,
          new URLSearchParams({ url: url, hd: 1 }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "User-Agent":
                "Mozilla/5.0 (Linux; Android 10; Mobile Safari/537.36)",
              "Referer": "https://www.tikwm.com/",
            },
          }
        )
      ).data.data;

      let data = [];
      if (res && res.images) {
        res.images.map((v) => {
          data.push({ type: "photo", url: v });
        });
      } else {
        if (res.wmplay) data.push({ type: "watermark", url: res.wmplay });
        if (res.play) data.push({ type: "nowatermark", url: res.play });
        if (res.hdplay) data.push({ type: "nowatermark_hd", url: res.hdplay });
      }

      let json = {
        status: true,
        title: res.title,
        taken_at: formatDate(res.create_time),
        region: res.region,
        duration: res.duration + " detik",
        cover: res.cover,
        author: {
          id: res.author.id,
          fullname: res.author.unique_id,
          nickname: res.author.nickname,
          avatar: res.author.avatar,
        },
        music_info: {
          title: res.music_info.title,
          author: res.music_info.author,
          url: res.music_info.play,
        },
        stats: {
          views: formatNumber(res.play_count),
          likes: formatNumber(res.digg_count),
          comment: formatNumber(res.comment_count),
          share: formatNumber(res.share_count),
          download: formatNumber(res.download_count),
        },
        data,
      };
      resolve(json);
    } catch (e) {
      reject(e);
    }
  });
}

// Rute untuk halaman utama
app.get("/", (req, res) => {
  const error = req.query.error || null;
  res.render("index", {
    error: error,
    title: "TikTok Video Downloader",
    description: "Unduh video TikTok tanpa watermark dengan mudah dan cepat.",
    logo: "https://raw.githubusercontent.com/ikyYourStar/ksr-api/refs/heads/main/ksr-image/Tak%20berjudul2_20250801114820.png"
  });
});

// Rute untuk proses download
app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.redirect("/?error=no_url");
    }
    const result = await tiktokDl(url);
    res.render("download", {
      result,
      title: "Hasil Download TikTok",
      logo: "https://raw.githubusercontent.com/ikyYourStar/ksr-api/refs/heads/main/ksr-image/Tak%20berjudul2_20250801114820.png"
    });
  } catch (err) {
    console.error("Download route error:", err);
    res.redirect("/?error=failed_download");
  }
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
