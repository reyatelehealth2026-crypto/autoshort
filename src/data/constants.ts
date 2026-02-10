import { SelectOption, ArtStyle, SuperStep } from '../types'

export const genreOptions: SelectOption[] = [
    { id: 'comedy', label: '😂 ตลก/ขำขัน', desc: 'คอนเทนต์สนุกสนาน ทำให้หัวเราะ' },
    { id: 'knowledge', label: '🧠 สาระความรู้', desc: 'สอนเทคนิค How-to' },
    { id: 'news', label: '📢 ข่าว/กระแส', desc: 'สรุปข่าวดังในโซเชียล' },
    { id: 'review', label: '🛍️ รีวิวสินค้า', desc: 'ป้ายยา แกะกล่อง' },
    { id: 'story', label: '📖 เล่าเรื่อง', desc: 'เล่าเรื่องราว นิทาน' },
    { id: 'drama', label: '🎬 ดราม่า', desc: 'ละคร ซีรีส์สั้น' },
]

export const orientationOptions: (SelectOption & { icon: string })[] = [
    { id: 'vertical', label: '📱 แนวตั้ง (9:16)', desc: 'TikTok, Reels, Shorts', icon: '📱' },
    { id: 'horizontal', label: '🖥️ แนวนอน (16:9)', desc: 'YouTube, Facebook', icon: '🖥️' },
    { id: 'square', label: '🟦 จัตุรัส (1:1)', desc: 'Instagram, Facebook', icon: '🟦' },
]

export const targetAudienceOptions: SelectOption[] = [
    { id: 'general', label: '👥 ทั่วไป', desc: 'เหมาะกับทุกคน' },
    { id: 'teens', label: '🎒 วัยรุ่น', desc: 'Gen Z, นักเรียน, นักศึกษา' },
    { id: 'adults', label: '👔 วัยทำงาน', desc: 'First Jobber, ผู้ใหญ่' },
    { id: 'kids', label: '🧸 เด็ก', desc: 'เนื้อหาสำหรับเด็ก' },
]

export const durationMap: Record<string, number> = {
    '5sec': 5,
    '6sec': 6,
    '7sec': 7,
    '8sec': 8,
    '9sec': 9,
    '10sec': 10,
    '15sec': 15,
    '30sec': 30,
    '60sec': 60
}

export const durationOptions: SelectOption[] = [
    { id: '5sec', label: '⚡ 5 วินาที' },
    { id: '6sec', label: '⚡ 6 วินาที' },
    { id: '7sec', label: '⚡ 7 วินาที' },
    { id: '8sec', label: '🎬 8 วินาที' },
    { id: '9sec', label: '🎬 9 วินาที' },
    { id: '10sec', label: '🎬 10 วินาที' },
    { id: '15sec', label: '📹 15 วินาที' },
    { id: '30sec', label: '🎥 30 วินาที' },
    { id: '60sec', label: '🎞️ 60 วินาที' },
]

export const toneOptions: SelectOption[] = [
    { id: 'friendly', label: '😊 เป็นกันเอง' },
    { id: 'professional', label: '💼 มืออาชีพ' },
    { id: 'funny', label: '😂 ตลกขบขัน' },
    { id: 'serious', label: '🧐 จริงจัง' },
    { id: 'excited', label: '🤩 ตื่นเต้น' },
    { id: 'relaxed', label: '😌 ผ่อนคลาย' },
]

export const voiceOptions: SelectOption[] = [
    { id: 'thai-female', label: 'ไทย (หญิง)' },
    { id: 'thai-male', label: 'ไทย (ชาย)' },
    { id: 'no-voice', label: '🔇 ไม่มีเสียงพากย์' },
]

export const musicOptions: SelectOption[] = [
    { id: 'upbeat', label: '🎵 Upbeat/สนุกสนาน' },
    { id: 'chill', label: '🎶 Chill/ผ่อนคลาย' },
    { id: 'dramatic', label: '🎻 Dramatic/ดราม่า' },
    { id: 'corporate', label: '💼 Corporate/ทางการ' },
    { id: 'no-music', label: '🔇 ไม่ใส่เพลง' },
]

export const artStyles: ArtStyle[] = [
    {
        id: 'cinematic',
        name: 'Cinematic Master',
        icon: '🎬',
        desc: 'สไตล์ Hollywood ระดับสูง พร้อมเอฟเฟกต์แสงและสี',
        params: '30mm LENS, DRAMATIC LIGHTING, ANAMORPHIC FLARES, COLOR-GRADED',
        image: '🎞️'
    },
    {
        id: 'neo-anime',
        name: 'Neo Anime',
        icon: '⛩️',
        desc: 'อนิเมะยุคใหม่ ลายเส้นคมชัด สีสันสดใส',
        params: 'MAKOTO SHINKAI STYLE, VIBRANT COLORS, HIGH DETAIL, 4K ANIME',
        image: '🌸'
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        icon: '🤖',
        desc: 'โลกอนาคต แสงนีออน เทคโนโลยีล้ำสมัย',
        params: 'CYBERPUNK CITY, NEON LIGHTS, FUTURISTIC, HIGH TECH',
        image: '🌃'
    },
    {
        id: 'horror',
        name: 'Dark Horror',
        icon: '👻',
        desc: 'บรรยากาศมืดมน น่ากลัว สยองขวัญ',
        params: 'DARK ATMOSPHERE, FOG, HORROR, SCARY, CREEPY',
        image: '🕸️'
    },
    {
        id: 'natgeo',
        name: 'NatGeo Reality',
        icon: '🌍',
        desc: 'ภาพถ่ายจริง สวยงาม สมจริงเหมือนสารคดี',
        params: 'NATIONAL GEOGRAPHIC PHOTO, 8K REALISM, HIGH DETAIL, NATURAL LIGHT',
        image: '📸'
    },
    {
        id: 'ue5',
        name: 'Unreal Engine 5',
        icon: '🎮',
        desc: 'กราฟิก 3D สมจริงระดับเกม Next-Gen',
        params: 'UNREAL ENGINE 5 RENDER, 3D, RAY TRACING, HYPER REALISTIC',
        image: '🕹️'
    }
]

export const superSteps: SuperStep[] = [
    { id: 'researching', label: '🔍 Fact-Checker', icon: '🕵️' },
    { id: 'selecting', label: '✅ Editor-in-Chief', icon: '👑' },
    { id: 'architecting', label: '🎨 Visual Architect', icon: '🎭' },
    { id: 'scripting', label: '✍️ Storyteller', icon: '📝' },
]
