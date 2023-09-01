type Props = {
  children: React.ReactNode;
};

function FieldSet({ children }: Props) {
  return (
    <fieldset className="border-x-2 border-y border-slate-400 bg-slate-300 px-6 py-4 md:flex md:content-center md:justify-between md:gap-5">
      {children}
    </fieldset>
  );
}

export default FieldSet;
