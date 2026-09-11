type Props = {
  compact?: boolean;
};

function Divider({ compact = false }: Readonly<Props>) {
  return (
    <div
      className={`${compact ? 'my-4' : 'my-8'} h-px w-full bg-linear-to-r from-transparent via-orange-300/80 to-transparent`}
      role="separator"
    />
  );
}

export default Divider;
