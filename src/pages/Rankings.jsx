import RankedList from '../components/RankedList'

export default function Rankings({ library, onOpen }) {
  return <RankedList items={Object.values(library)} onOpen={onOpen} showFilter />
}
