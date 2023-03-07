import { useEffect, useState } from 'react';

const useMouthPosition = (ref, image) => {
  const [mousePos, setMousePos] = useState({});

  useEffect(() => {
    const current = ref && ref.current;

    const handleMouseMove = (event) => {
      const offset = current && current.getBoundingClientRect()
      setMousePos({
        x: event.clientX - offset.left,
        y: event.clientY - offset.top,
        height: offset.height,
      });
    };

    if (current) {
      current.addEventListener('mousemove', handleMouseMove);

      return () => {
        current.removeEventListener(
          'mousemove',
          handleMouseMove
        );
      };
    }
  }, [ref, image]);

  return [mousePos, () => setMousePos({})];
}
export default useMouthPosition;