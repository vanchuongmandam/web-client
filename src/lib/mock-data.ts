import type { Article, Book } from './types';

export const articles: Article[] = [
  {
    id: '1',
    slug: 'nghe-thuat-trong-tho-haiku',
    title: 'Nghệ thuật Tĩnh Lặng trong Thơ Haiku Nhật Bản',
    author: 'Trần Văn A',
    date: '15 tháng 7, 2024',
    category: 'Phê bình & Tiểu luận',
    excerpt: 'Khám phá sự tinh tế của thơ Haiku, một hình thức nghệ thuật cô đọng nắm bắt khoảnh khắc của tự nhiên và cảm xúc con người.',
    content: `Thơ Haiku, với cấu trúc 5-7-5 âm tiết ngắn gọn, là một viên ngọc quý trong kho tàng văn học Nhật Bản. Nó không chỉ là những con chữ được sắp đặt, mà là một cánh cửa mở ra thế giới quan của người Nhật, nơi sự tĩnh lặng, sự quan sát tinh tế và sự hòa hợp với thiên nhiên được đề cao.

Mỗi bài Haiku là một bức tranh thu nhỏ, vẽ nên bởi những nét bút tối giản nhất. Nhà thơ Basho, một trong những bậc thầy vĩ đại nhất của thể loại này, đã từng viết:

"Ao cũ
con ếch nhảy vào
vang tiếng nước xao."

Chỉ với vài từ, Basho đã tạo ra một không gian đầy âm thanh và sự sống. Chúng ta không chỉ "thấy" con ếch, mà còn "nghe" được tiếng nước, "cảm" được sự tĩnh mịch của ao cũ bị phá vỡ. Đó chính là sức mạnh của Haiku: gợi nhiều hơn tả, để lại không gian cho trí tưởng tượng của người đọc bay bổng.

Nghệ thuật của Haiku nằm ở "kireji" (từ ngắt) và "kigo" (quý ngữ - từ chỉ mùa). Kireji tạo ra một khoảng lặng, một sự phân chia tinh tế trong bài thơ, cho phép hai hình ảnh đối chiếu hoặc bổ sung cho nhau. Kigo kết nối bài thơ với một mùa cụ thể trong năm, đặt cảm xúc của con người vào vòng tuần hoàn của đất trời.

Trong thế giới hiện đại hối hả, việc đọc và cảm nhận Haiku giống như một liệu pháp thiền định. Nó dạy chúng ta cách sống chậm lại, quan sát những điều nhỏ bé xung quanh và tìm thấy vẻ đẹp trong sự đơn sơ, tĩnh lặng.`,
    imageUrl: 'https://placehold.co/800x450',
    imageHint: 'Japanese temple',
    trending: true,
  },
  {
    id: '2',
    slug: 'chu-nghia-hien-thuc-trong-van-hoc-viet-nam',
    title: 'Chủ nghĩa Hiện thực trong Văn học Việt Nam 1930-1945',
    author: 'Nguyễn Thị B',
    date: '10 tháng 7, 2024',
    category: 'Phê bình & Tiểu luận',
    excerpt: 'Phân tích sâu sắc về dòng văn học hiện thực phê phán, phản ánh chân thực xã hội Việt Nam thời kỳ trước Cách mạng.',
    content: 'Giai đoạn 1930-1945 chứng kiến sự bùng nổ của dòng văn học hiện thực phê phán, một cột mốc quan trọng trong lịch sử văn học Việt Nam. Các tác giả như Nam Cao, Vũ Trọng Phụng, Ngô Tất Tố đã dùng ngòi bút sắc bén của mình để phơi bày những bất công, thối nát của xã hội thực dân nửa phong kiến. Tác phẩm của họ là tiếng nói của những người nông dân cùng khổ, những trí thức nghèo và những kiếp người bị xã hội vùi dập. Đây là một đoạn văn mẫu để thử nghiệm AI.',
    imageUrl: 'https://placehold.co/600x400',
    imageHint: 'vietnam countryside',
    trending: true,
  },
  {
    id: '3',
    slug: 'anh-nang-cuoi-vuon',
    title: 'Ánh Nắng Cuối Vườn',
    author: 'Lê Cẩm H',
    date: '05 tháng 7, 2024',
    category: 'Sáng tác',
    excerpt: 'Một truyện ngắn nhẹ nhàng về ký ức tuổi thơ, về những buổi chiều hè vàng óng và nỗi buồn man mác của thời gian.',
    content: 'Nắng chiều xiên khoai, nhuộm vàng cả khu vườn nhỏ sau nhà. Tôi ngồi bên bậc cửa, nhìn theo những vệt nắng cuối cùng đang cố níu kéo trên lá cây. Khu vườn này, nơi chứa đựng cả một thời thơ ấu của tôi, giờ đây sao mà tĩnh lặng. Tôi nhớ những ngày hè cùng lũ bạn chơi trốn tìm, tiếng cười giòn tan vang vọng khắp không gian. Thời gian trôi đi, chỉ còn lại những ký ức và một nỗi buồn không tên.',
    imageUrl: 'https://placehold.co/600x400',
    imageHint: 'sunny garden',
  },
  {
    id: '4',
    slug: 'goc-nhin-ve-truyen-kieu',
    title: 'Một góc nhìn mới về Truyện Kiều',
    author: 'Phan Văn D',
    date: '01 tháng 7, 2024',
    category: 'Phê bình & Tiểu luận',
    excerpt: 'Bàn luận về những giá trị nhân văn và nghệ thuật của Truyện Kiều dưới lăng kính của độc giả thế kỷ 21.',
    content: 'Truyện Kiều của Nguyễn Du không chỉ là một kiệt tác văn học, mà còn là một di sản văn hóa của dân tộc. Mỗi thế hệ lại có một cách đọc và một cách cảm nhận riêng về tác phẩm. Ngày nay, chúng ta không chỉ nhìn Kiều như một nạn nhân của xã hội phong kiến, mà còn thấy ở nàng một biểu tượng của sức sống mãnh liệt, khát khao tự do và hạnh phúc. Phân tích tác phẩm dưới góc nhìn nữ quyền luận, tâm lý học hiện đại mở ra những tầng nghĩa mới mẻ và sâu sắc.',
    imageUrl: 'https://placehold.co/600x400',
    imageHint: 'classic literature',
  },
  {
    id: '5',
    slug: 'mua-roi-tren-pho-co',
    title: 'Mưa Rơi Trên Phố Cổ',
    author: 'Hoàng Thiên E',
    date: '28 tháng 6, 2024',
    category: 'Sáng tác',
    excerpt: 'Những giọt mưa tháng sáu gõ nhịp trên mái ngói rêu phong, khơi gợi một nỗi niềm hoài cổ về Hà Nội xưa.',
    content: 'Hà Nội vào mưa. Những cơn mưa bất chợt của tháng sáu không làm người ta khó chịu, trái lại, nó gột rửa đi cái oi nồng của mùa hè. Tôi thích đi dạo dưới mưa, len lỏi qua những con ngõ nhỏ của phố cổ. Mùi đất ẩm, mùi ngói rêu phong và mùi của thời gian hòa quyện vào nhau, tạo nên một hương vị rất riêng của Hà Nội.',
    imageUrl: 'https://placehold.co/600x400',
    imageHint: 'hanoi old quarter rain',
  },
    {
    id: '6',
    slug: 'bieu-tuong-hoa-sen',
    title: 'Biểu tượng Hoa Sen trong văn hóa Việt',
    author: 'Mai Anh F',
    date: '25 tháng 6, 2024',
    category: 'Phê bình & Tiểu luận',
    excerpt: 'Hoa sen, loài hoa "gần bùn mà chẳng hôi tanh mùi bùn", mang trong mình những giá trị triết lý và thẩm mỹ sâu sắc.',
    content: 'Trong văn hóa Việt Nam, hoa sen không chỉ là một loài hoa đẹp mà còn là một biểu tượng của sự thanh cao, thuần khiết và giác ngộ. Hình ảnh hoa sen xuất hiện trong kiến trúc chùa chiền, trong nghệ thuật và trong cả đời sống hàng ngày, thể hiện những phẩm chất cao quý của con người Việt Nam.',
    imageUrl: 'https://placehold.co/600x400',
    imageHint: 'lotus flower',
    trending: true,
  },
  {
    id: '7',
    slug: 'chuyen-tau-dem',
    title: 'Chuyến Tàu Đêm',
    author: 'Vũ Quốc G',
    date: '20 tháng 6, 2024',
    category: 'Sáng tác',
    excerpt: 'Trên chuyến tàu cuối cùng rời khỏi thành phố, mỗi hành khách mang theo một câu chuyện, một nỗi niềm riêng.',
    content: 'Tiếng còi tàu vang lên, xé tan màn đêm tĩnh mịch. Chuyến tàu đêm chậm rãi lăn bánh, mang theo những phận người với những tâm sự thầm kín. Có người rời đi để tìm một tương lai mới, có người trở về sau những năm tháng bôn ba. Con tàu như một xã hội thu nhỏ, nơi những mảnh đời xa lạ vô tình gặp nhau trong một khoảnh khắc.',
    imageUrl: 'https://placehold.co/600x400',
    imageHint: 'night train',
  }
];

export const books: Book[] = [
    {
        id: '1',
        title: 'Số Đỏ',
        author: 'Vũ Trọng Phụng',
        imageUrl: 'https://placehold.co/300x450',
        imageHint: 'vietnamese book cover',
    },
    {
        id: '2',
        title: 'Dế Mèn Phiêu Lưu Ký',
        author: 'Tô Hoài',
        imageUrl: 'https://placehold.co/300x450',
        imageHint: 'childrens book',
    },
    {
        id: '3',
        title: 'Đời Thừa',
        author: 'Nam Cao',
        imageUrl: 'https://placehold.co/300x450',
        imageHint: 'classic book cover',
    },
    {
        id: '4',
        title: 'Gió Lạnh Đầu Mùa',
        author: 'Thạch Lam',
        imageUrl: 'https://placehold.co/300x450',
        imageHint: 'vintage book',
    }
]
