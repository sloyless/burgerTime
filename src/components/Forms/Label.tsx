type Props = {
  children: React.ReactNode;
  id: string;
};

function Label({ children, id }: Props) {
  return (
    <label htmlFor={id} className="w-1/3 py-2 font-bold text-slate-700">
      {children}
    </label>
  );
}

export default Label;
