import Image from 'next/image'

type Props = {
  imageUrl: string
  caption: string
}

export default function ImageCard({ imageUrl, caption }: Props) {
  return (
    <figure className="w-[250px] overflow-hidden rounded-base border-2 border-border bg-main font-base shadow-shadow">
      <div className="relative w-full aspect-[4/3]">
        <Image 
          src={imageUrl} 
          alt="image"
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <figcaption className="border-t-2 text-mtext border-border p-4">
        {caption}
      </figcaption>
    </figure>
  )
}
