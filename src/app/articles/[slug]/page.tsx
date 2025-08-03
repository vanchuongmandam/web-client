import { RecommendationEngine } from '@/components/recommendation-engine';

const articleContent = `Ánh sáng xanh, một ngọn hải đăng gần như huyền bí ở cuối bến tàu của Daisy, được cho là một trong những biểu tượng mạnh mẽ nhất trong văn học Mỹ. Đối với Jay Gatsby, nó đại diện cho niềm hy vọng bất diệt và giấc mơ dường như không thể đạt được về việc giành lại quá khứ với Daisy Buchanan. Đó là một mối liên kết hữu hình với phiên bản lý tưởng hóa của anh về cô, một lời nhắc nhở thường trực về khoảng cách ngăn cách họ, cả về mặt vật lý qua mặt nước và về mặt cảm xúc qua thời gian và tầng lớp xã hội.

Ánh sáng đơn độc, không đổi này thể hiện bản chất của Giấc mơ Mỹ, một khái niệm trung tâm trong bài phê bình của F. Scott Fitzgerald về xã hội những năm 1920. Nó cho thấy rằng giấc mơ luôn ở ngay ngoài tầm với, một ảo ảnh lung linh thúc đẩy tham vọng nhưng cuối cùng lại dẫn đến sự vỡ mộng. Việc Gatsby không ngừng theo đuổi ánh sáng xanh là một minh chứng cho "món quà hy vọng phi thường" của anh, một phẩm chất mà Nick Carraway vừa ngưỡng mộ vừa thương hại. Màu sắc của chính ánh sáng cũng rất có ý nghĩa; màu xanh lá cây không chỉ tượng trưng cho hy vọng và sự đổi mới mà còn cho sự giàu có và lòng ghen tị, phản ánh những động cơ phức tạp thúc đẩy các nhân vật. Cuối cùng, ánh sáng xanh đóng vai trò như một phép ẩn dụ mạnh mẽ cho bản chất khó nắm bắt của hạnh phúc và những hậu quả bi thảm của việc níu kéo một quá khứ được lý tưởng hóa.`;

const moreContent = `Xuyên suốt cuốn tiểu thuyết, ý nghĩa của ánh sáng đã phát triển. Ban đầu, nó là một biểu tượng riêng tư đối với Gatsby, một vật tổ cá nhân cho tình yêu của anh. Khi Nick quan sát Gatsby vươn tới nó qua vịnh, đó là một khoảnh khắc của sự cô đơn và khao khát sâu sắc. Sau đó, khi Gatsby và Daisy được đoàn tụ trong thời gian ngắn, sức mạnh biểu tượng của ánh sáng dường như giảm đi đối với anh. "Anh không thể lặp lại quá khứ," Nick cảnh báo, nhưng toàn bộ sự tồn tại của Gatsby là một minh chứng cho việc anh từ chối tin vào điều đó. Biệt thự, những bữa tiệc, sự giàu có của anh — tất cả đều là những cấu trúc được xây dựng để dụ Daisy trở lại, để quay ngược thời gian về với khởi đầu lãng mạn của họ.

Cuối cùng, khi Nick suy ngẫm về giấc mơ của Gatsby, ánh sáng xanh đã vượt qua nhiệm vụ cá nhân của Gatsby và trở thành một biểu tượng phổ quát cho mọi khát vọng của con người. "Gatsby đã tin vào ánh sáng xanh, cái tương lai cực khoái mà năm này qua năm khác lùi xa trước mắt chúng ta. Lúc đó nó đã lẩn tránh chúng ta, nhưng điều đó không quan trọng - ngày mai chúng ta sẽ chạy nhanh hơn, vươn tay xa hơn. . . . Và một buổi sáng đẹp trời —— Vì vậy, chúng ta cứ tiếp tục, những con thuyền ngược dòng, không ngừng bị đẩy lùi về quá khứ."`;


export default function ArticlePage({ params }: { params: { slug: string } }) {
  const title = params.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <article>
        <header className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">Đăng bởi nhân viên Văn Chương Mạn Đàm vào {new Date().toLocaleDateString('vi-VN')}</p>
        </header>

        <div className="space-y-6 text-lg font-body leading-relaxed text-foreground/90">
          <p>{articleContent}</p>
          <p>{moreContent}</p>
        </div>
        
        <RecommendationEngine text={`${articleContent}\n${moreContent}`} />
      </article>
    </div>
  );
}
